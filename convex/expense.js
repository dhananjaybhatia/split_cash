import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getExpensesBetweenUsers = query({
  args: {
    userId: v.id("users"),
  },
  handlers: async (ctx, { userId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");
    if (currentUser._id === userId) throw new Error("Canot query yourself");

    const mePaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const theyPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId).eq("groupId", undefined)
      )
      .collect();
    const candidateExpenses = [...mePaid, ...theyPaid];

    const expense = candidateExpenses.filter((e) => {
      const meInSplits = e.splits.some((s) => s.userId === currentUser._id);
      const themInSplits = e.splits.some((s) => s.userId === userId);

      const meInvolved = e.paidByUserId === currentUser._id || meInSplits;
      const themInvolved = e.paidByUserId === userId || themInSplits;

      return meInvolved && themInvolved;
    });
    expense.sort((a, b) => b.date - a.date);

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

    let balance = 0;

    for await (const e of expenses) {
      if (e.paidByUserId === currentUser._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount;
      } else {
        const split = e.splits.find(
          (s) => s.userId === currentUser._id && !s.paid
        );
        if (split) balance -= split.amount;
      }
    }
    for (const s of settlements) {
      if (s.paidByUserId === currentUser._id) balance += s.amount;
      else balance -= s.amount;
    }
    const other = await ctx.db.query.get(userId);
    if (!other) throw new Error("User not found");
    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});
