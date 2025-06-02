import { v } from "convex/values";
import { query } from "./_generated/server";

export const getUsersWithOutstandingDebts = query({
  handler: async (ctx) => {
    // 1. Fetch all users and initialize result array
    const users = await ctx.db.query("users").collect();
    const result = [];

    // 2. Fetch all relevant expenses and settlements in bulk
    const [expenses, settlements] = await Promise.all([
      ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect(),
      ctx.db
        .query("settlements")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect(),
    ]);

    // 3. User cache for efficient lookups
    const userCache = new Map(users.map((user) => [user._id, user]));

    // 4. Process each user's debts
    for (const user of users) {
      const ledger = new Map(); // Tracks net balances {userId: {amount, since}}

      // 5. Process expenses affecting this user
      expenses.forEach((exp) => {
        if (exp.paidByUserId !== user._id) {
          // User is a participant in someone else's expense
          const userSplit = exp.splits.find(
            (s) => s.userId === user._id && !s.paid
          );
          if (!userSplit) return;

          const creditorId = exp.paidByUserId;
          const ledgerEntry = ledger.get(creditorId) || {
            amount: 0,
            since: exp.date,
          };
          ledgerEntry.amount += userSplit.amount;
          ledgerEntry.since = Math.min(ledgerEntry.since, exp.date);
          ledger.set(creditorId, ledgerEntry);
        } else {
          // User paid this expense - track who owes them
          exp.splits.forEach((split) => {
            if (split.userId === user._id || split.paid) return;
            const debtorId = split.userId;
            const ledgerEntry = ledger.get(debtorId) || {
              amount: 0,
              since: exp.date,
            };
            ledgerEntry.amount -= split.amount; // Negative = user is owed money
            ledger.set(debtorId, ledgerEntry);
          });
        }
      });

      // 6. Process settlements affecting this user
      settlements.forEach((st) => {
        if (st.paidByUserId === user._id) {
          // User paid this settlement - reduces what others owe them
          const entry = ledger.get(st.receivedByUserId);
          if (entry) {
            entry.amount -= st.amount;
            if (Math.abs(entry.amount) < 0.01) {
              // Account for floating point
              ledger.delete(st.receivedByUserId);
            }
          }
        } else if (st.receivedByUserId === user._id) {
          // User received this settlement - reduces what they owe others
          const entry = ledger.get(st.paidByUserId);
          if (entry) {
            entry.amount += st.amount;
            if (Math.abs(entry.amount) < 0.01) {
              ledger.delete(st.paidByUserId);
            }
          }
        }
      });

      // 7. Compile outstanding debts (where user is owed money)
      const debts = Array.from(ledger.entries())
        .filter(([_, { amount }]) => amount > 0.01) // Ignore tiny amounts
        .map(([userId, { amount, since }]) => ({
          userId,
          name: userCache.get(userId)?.name || "Unknown",
          amount: parseFloat(amount.toFixed(2)), // Clean decimal places
          since,
        }));

      if (debts.length > 0) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          debts,
        });
      }
    }

    return result;
  },
});

//Get users with expenses for AI insights
export const getUsersWithExpenses = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const result = [];

    //Get current month start
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthStart = oneMonthAgo.getTime();

    for (const user of users) {
      const paidExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .filter((q) => q.eq(q.field("paidByUserId"), user._id))
        .collect();

      const allRecentExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .collect();

      const splitExpenses = allRecentExpenses.filter((expense) =>
        expense.splits.some((split) => split.userId === user._id)
      );

      const userExpenses = [...new Set([...paidExpenses, ...splitExpenses])];

      if (userExpenses.length > 0) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
        });
      }
    }
    return result;
  },
});

export const getUserMonthlyExpenses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthStart = oneMonthAgo.getTime();

    // Fetch all expenses in the past month
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", monthStart))
      .collect();

    // Filter expenses involving the user
    const userExpenses = allExpenses.filter(
      (expense) =>
        expense.paidByUserId === args.userId ||
        expense.splits.some((split) => split.userId === args.userId)
    );

    // Map relevant fields for the user
    return userExpenses.map((expense) => {
      const userSplit = expense.splits.find(
        (split) => split.userId === args.userId
      );

      return {
        description: expense.description,
        category: expense.category,
        date: expense.date,
        amount: userSplit ? userSplit.amount : 0,
        isPayer: expense.paidByUserId === args.userId,
        isGroup: expense.groupId !== undefined,
      };
    });
  },
});

