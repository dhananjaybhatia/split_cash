import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

export const createExpenses = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error(" Group not found");
      const isMember = group.members?.some((m) => m.userId === currentUser._id);
      if (!isMember) {
        throw new Error("You are not a member of this group");
      }
    }

    //Verify that splits add up to the total amount(with small tolerance for floating point issues)

    const totalSplitAmount = args.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const tolerance = 0.01; // Allow for small rounding errors

    if (Math.abs(totalSplitAmount - args.amount) > tolerance) {
      throw new Error("split amounts must add up to the total expense amount");
    }

    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Others",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: currentUser._id,
    });
    return expenseId;
  },
});

export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    // Get the expense
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    // Check if user is authorized to delete this expense
    // Only the creator of the expense or the payer can delete it
    if (
      expense.createdBy !== currentUser._id &&
      expense.paidByUserId !== currentUser._id
    ) {
      throw new Error("You don't have permission to delete this expense");
    }

    // Delete any settlements that specifically reference this expense
    // Since we can't use array.includes directly in the filter, we'll
    // fetch all settlements and then filter in memory
    const allSettlements = await ctx.db.query("settlements").collect();

    const relatedSettlements = allSettlements.filter(
      (settlement) =>
        settlement.relatedExpenseIds !== undefined &&
        settlement.relatedExpenseIds.includes(args.expenseId)
    );

    for (const settlement of relatedSettlements) {
      // Remove this expense ID from the relatedExpenseIds array
      const updatedRelatedExpenseIds = settlement.relatedExpenseIds.filter(
        (id) => id !== args.expenseId
      );

      if (updatedRelatedExpenseIds.length === 0) {
        // If this was the only related expense, delete the settlement
        await ctx.db.delete(settlement._id);
      } else {
        // Otherwise update the settlement to remove this expense ID
        await ctx.db.patch(settlement._id, {
          relatedExpenseIds: updatedRelatedExpenseIds,
        });
      }
    }

    // Delete the expense
    await ctx.db.delete(args.expenseId);

    return { success: true };
  },
});
