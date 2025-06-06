import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// We are writing a query to get all the details about one group’s expenses
export const getGroupExpenses = query({
  args: { groupId: v.id("groups") }, // We expect the caller to send a group ID.

  handler: async (ctx, { groupId }) => {
    // Step 1: Get the current user who is using the app
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated"); // If not logged in, stop here.

    // Step 2: Get the group information using the group ID
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found"); // If no group found, stop here.

    // Step 3: Check if the user is a part of the group
    if (!group.members.some((m) => m.userId === currentUser._id))
      throw new Error("You are not a member of this group");

    // Step 4: Get all the expenses that belong to this group
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId)) // Use the index to find expenses by groupId
      .collect();

    // Step 5: Get all the settlements (payments between people) for this group
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), groupId)) // Filter by same groupId
      .collect();

    // Step 6: For every member in the group, get their user info (like name, picture, etc.)
    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return {
          id: u._id,
          name: u.name,
          imageUrl: u.imageUrl,
          role: m.role, // Like "admin" or "member"
        };
      })
    );

    // Step 7: Create a list of just the member IDs
    const ids = memberDetails.map((m) => m.id);

    // Step 8: Setup a “totals” box for each user to track how much they owe or are owed
    const totals = Object.fromEntries(ids.map((id) => [id, 0]));

    // Step 9: Create a big table (ledger) that tracks who owes how much to whom
    const ledger = {};
    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => {
        if (a != b) ledger[a][b] = 0; // Start everyone at 0
      });
    });

    // Step 10: Go through each expense and update the totals and ledger
    for (const exp of expenses) {
      const payer = exp.paidByUserId;

      for (const split of exp.splits) {
        if (split.userId === payer || split.paid) continue; // Skip if the user paid for themself or already paid

        const debtor = split.userId;
        const amt = split.amount;

        totals[payer] += amt; // The one who paid is owed money
        totals[debtor] -= amt; // The one who owes loses money

        ledger[debtor][payer] += amt; // Update who owes whom in the ledger
      }
    }

    // Step 11: Go through each settlement and update totals and ledger again
    for (const s of settlements) {
      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;

      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount; // They paid it back
    }

    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a > b) return;

        //calculate the net debt between two users
        const diff = ledger[a][b] - ledger[b][a];

        if (diff > 0) {
          ledger[a][b] = diff;
          ledger[b][a] = 0;
        } else if (diff < 0) {
          ledger[b][a] = -diff;
          ledger[a][b] = 0;
        } else {
          ledger[a][b] = ledger[b][a] = 0;
        }
      });
    });

    // Step 12: Make a list of balances for each member, showing what they owe or are owed
    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: totals[m.id], // Total net position
      owes: Object.entries(ledger[m.id]) // Who they owe money to
        .filter(([, v]) => v > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledger[other][m.id] > 0) // Who owes them money
        .map((from) => ({ from, amount: ledger[from][m.id] })),
    }));

    // Step 13: Create a quick lookup dictionary to get user info by their ID
    const userLookupMap = {};
    memberDetails.forEach((member) => {
      userLookupMap[member.id] = member;
    });

    // Step 14: Send everything back to the frontend
    return {
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      member: memberDetails,
      expenses,
      settlements,
      balances,
      userLookupMap,
    };
  },
});

export const deleteExpense = mutation({
  // 💡 Step 0: Define the input we expect: an expense ID
  args: { expenseId: v.id("expenses") },

  handler: async (ctx, args) => {
    // ✅ Step 1: Who is trying to delete?
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    // ❌ If the user is not logged in, we stop here.
    if (!currentUser) throw new Error("Not authenticated");

    // ✅ Step 2: Find the expense that the user wants to delete
    const expense = await ctx.db.get(args.expenseId);

    // ❌ If the expense doesn’t exist (maybe already deleted), stop
    if (!expense) {
      throw new Error("Expense not found");
    }

    // 🔒 Step 3: Only allow deleting if:
    // - You created the expense
    // - OR you paid for it
    if (
      expense.createdBy !== currentUser._id && // You didn't create it
      expense.paidByUserId !== currentUser._id // And you also didn’t pay for it
    ) {
      throw new Error("You don't have permission to delete this expense");
    }

    // ✅ Step 4: If we passed all checks, delete the expense from the database
    await ctx.db.delete(args.expenseId);

    // ✅ Step 5: Return a success status to the frontend
    return { success: true };
  },
});

export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")), //Optional - if provided, will return details for just this group
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups.filter((group) =>
      group.members.some((m) => m.userId === currentUser._id)
    );
    if (args.groupId) {
      const selectedGroup = userGroups.find(
        (group) => group._id === args.groupId
      );
      if (!selectedGroup) {
        throw new Error("Group not found or your're not a member");
      }

      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (member) => {
          const user = await ctx.db.get(member.userId);
          if (!user) return null;

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: member.role,
          };
        })
      );

      const validMembers = memberDetails.filter((m) => m !== null);

      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          members: validMembers,
        },
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    } else {
      return {
        selectedGroup: null,
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    }
  },
});
