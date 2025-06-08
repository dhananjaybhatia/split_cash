import { internal } from "./_generated/api";
import { query } from "./_generated/server";

export const getUserBalance = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const expenses = (await ctx.db.query("expenses").collect()).filter(
      (e) =>
        e.paidByUserId === currentUser._id ||
        e.splits.some((s) => s.userId === currentUser._id)
    );

    let youOwe = 0;
    let youAreOwed = 0;
    const balanceByUser = {};

    for (const e of expenses) {
      const isPayer = e.paidByUserId === currentUser._id;
      const mySplit = e.splits.find((s) => s.userId === currentUser._id);

      if (isPayer) {
        for (const s of e.splits) {
          if (s.userId === currentUser._id || s.paid) continue;
          youAreOwed += s.amount;
          (balanceByUser[s.userId] ??= { owed: 0, owing: 0 }).owed += s.amount;
        }
      } else if (mySplit && !mySplit.paid) {
        youOwe += mySplit.amount;
        (balanceByUser[e.paidByUserId] ??= { owed: 0, owing: 0 }).owing +=
          mySplit.amount;
      }
    }
    const settlements = (await ctx.db.query("settlements").collect()).filter(
      (s) =>
        s.paidByUserId === currentUser._id ||
        s.receivedByUserId === currentUser._id
    );
    // for (const s of settlements) {
    //   if (s.paidByUserId === currentUser._id) {
    //     youOwe -= s.amount;
    //     (balanceByUser[s.receivedByUserId] ??= { owed: 0, owing: 0 }).owing -=
    //       s.amount;
    //   } else {
    //     youAreOwed -= s.amount;
    //     (balanceByUser[s.paidByUserId] ??= { owed: 0, owing: 0 }).owed -=
    //       s.amount;
    //   }
    // }

    for (const s of settlements) {
      const paidTo = s.receivedByUserId;
      const paidBy = s.paidByUserId;

      if (paidBy === currentUser._id) {
        youOwe -= s.amount;
        (balanceByUser[paidTo] ??= { owed: 0, owing: 0 }).owing -= s.amount;
      } else if (paidTo === currentUser._id) {
        youAreOwed -= s.amount;
        (balanceByUser[paidBy] ??= { owed: 0, owing: 0 }).owed -= s.amount;
      }
    }

    const youOweList = [];
    const youAreOwedByList = [];

    for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
      const net = owed - owing;
      if (net === 0) continue;

      const conterpart = await ctx.db.get(uid);
      const base = {
        userId: uid,
        name: conterpart?.name ?? "unknown",
        image: conterpart?.imageUrl,
        amount: Math.abs(net),
      };
      net > 0 ? youAreOwedByList.push(base) : youOweList.push(base);
    }
    youOweList.sort((a, b) => b.amount - a.amount);
    youAreOwedByList.sort((a, b) => b.amount - a.amount);

    return {
      youOwe,
      youAreOwed: Math.max(0, youAreOwed),
      totalBalance:
        Math.max(0, youAreOwed - youOwe) - Math.max(0, youOwe - youAreOwed),
      oweDetails: { youOwe: youOweList, youAreOwedBy: youAreOwedByList },
    };
  },
});

export const getTotalSpent = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", startOfYear))
      .collect();

    const userExpenses = expenses.filter(
      (expense) =>
        expense.paidByUserId === currentUser._id ||
        expense.splits.some((split) => split.userId === currentUser._id)
    );

    let totalSpent = 0;
    userExpenses.forEach((expense) => {
      const userSplit = expense.splits.find(
        (split) => split.userId === currentUser._id
      );
      if (userSplit) {
        totalSpent += userSplit.amount;
      }
    });
    return totalSpent;
  },
});

export const getMonthlySpending = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", startOfYear))
      .collect();

    const userExpenses = allExpenses.filter(
      (expense) =>
        expense.paidByUserId === currentUser._id ||
        expense.splits.some((split) => split.userId === currentUser._id)
    );
    const monthlyTotals = {};

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, i, 1);
      monthlyTotals[monthDate.getTime()] = 0;
    }

    userExpenses.forEach((expense) => {
      const date = new Date(expense.date);

      const monthStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ).getTime();
      const userSplit = expense.splits.find(
        (split) => split.userId === currentUser._id
      );
      if (userSplit) {
        monthlyTotals[monthStart] =
          (monthlyTotals[monthStart] || 0) + userSplit.amount;
      }
    });

    const result = Object.entries(monthlyTotals).map(([month, total]) => ({
      month: parseInt(month),
      total,
    }));
    result.sort((a, b) => a.month - b.month);
    return result;
  },
});

export const getUserGroups = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");
    const allGroups = await ctx.db.query("groups").collect();
    const groups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === currentUser._id)
    );

    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        const expenses = await ctx.db
          .query("expenses")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        let balance = 0;

        expenses.forEach((expense) => {
          if (expense.paidByUserId === currentUser._id) {
            expense.splits.forEach((split) => {
              if (split.userId !== currentUser._id && !split.paid) {
                balance += split.amount;
              }
            });
          } else {
            const userSplit = expense.splits.find(
              (split) => split.userId === currentUser._id
            );
            if (userSplit && !userSplit.paid) {
              balance -= userSplit.amount;
            }
          }
        });

        const settlements = await ctx.db
          .query("settlements")
          .filter((q) =>
            q.and(
              q.eq(q.field("groupId"), group._id),
              q.or(
                q.eq(q.field("paidByUserId"), currentUser._id),
                q.eq(q.field("receivedByUserId"), currentUser._id)
              )
            )
          )
          .collect();

        settlements.forEach((settlement) => {
          if (settlement.paidByUserId === currentUser._id) {
            balance += settlement.amount;
          } else {
            balance -= settlement.amount;
          }
        });
        return {
          ...group,
          id: group._id,
          balance,
        };
      })
    );
    return enhancedGroups;
  },
});
