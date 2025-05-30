import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getExpensesBetweenUsers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");
    if (currentUser._id === userId) throw new Error("Cannot query yourself");

    // Get expenses where either user paid (in personal context)
    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId).eq("groupId", undefined)
      )
      .collect();

    // Merge candidate expenses
    const candidateExpenses = [...myPaid, ...theirPaid];

    // Filter to only include expenses where both users are involved
    const expenses = candidateExpenses.filter((e) => {
      const meInSplits = e.splits.some((s) => s.userId === currentUser._id);
      const themInSplits = e.splits.some((s) => s.userId === userId);

      const meInvolved = e.paidByUserId === currentUser._id || meInSplits;
      const themInvolved = e.paidByUserId === userId || themInSplits;

      return meInvolved && themInvolved;
    });

    // Sort by date (newest first)
    expenses.sort((a, b) => b.date - a.date);

    // Get settlements between the two users
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.eq(q.field("groupId"), undefined),
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), currentUser._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
              q.eq(q.field("receivedByUserId"), currentUser._id)
            )
          )
        )
      )
      .collect();

    settlements.sort((a, b) => b.date - a.date);

    // Calculate balance
    let balance = 0;

    for (const e of expenses) {
      if (e.paidByUserId === currentUser._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount; // They owe me
      } else {
        const split = e.splits.find(
          (s) => s.userId === currentUser._id && !s.paid
        );
        if (split) balance -= split.amount; // I owe them
      }
    }

    for (const s of settlements) {
      if (s.paidByUserId === currentUser._id) {
        balance += s.amount; // I paid them back
      } else {
        balance -= s.amount; // They paid me back
      }
    }

    // Get other user's details
    const otherUser = await ctx.db.get(userId);
    if (!otherUser) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        imageUrl: otherUser.imageUrl,
      },
      balance,
    };
  },
});
