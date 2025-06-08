import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const createSettlement = mutation({
  arg: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.paidByUserId === args.receivedByUserId)
      throw new Error(" Payer and reciver cannot be the same user");
    if (
      currentUser._id !== args.paidByUserId &&
      currentUser._id !== args.receivedByUserId
    )
      throw new Error("You must be either the payer or the receiver");
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");
      const isMember = (uid) => group.members?.some((m) => m.userId === uid);
      if (!isMember(args.paidByUserId) || !isMember(args.receivedByUserId)) {
        throw new Error("Both parties must be members of the group");
      }
    }

    return await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      relatedExpenseIds: args.relatedExpenseIds,
      createdBy: currentUser._id,
    });
  },
});

export const getSettlementData = query({
  args: {
    entityType: v.string(), // "user" || "group"
    entityId: v.string(), // convex _id (string form) of the user or group
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (args.entityType === "user") {
      const otherUser = await ctx.db.get(args.entityId);
      if (!otherUser) throw new Error("Other User not found");

      const myExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined)
        )
        .collect();
      const otherUserExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", otherUser._id).eq("groupId", undefined)
        )
        .collect();
      const expenses = [...myExpenses, ...otherUserExpenses];

      let owed = 0; // they owe me
      let owing = 0; // I owe them

      for (const exp of expenses) {
        const involvesMe =
          exp.paidByUserId === me._id ||
          exp.splits.some((s) => s.userId === me._id);
        const involvesThem =
          exp.paidByUserId === otherUser._id ||
          exp.splits.some((s) => s.userId === otherUser._id);
        if (!involvesMe || !involvesThem) continue;

        // case 1: I paid:
        if (exp.paidByUserId === me._id) {
          const split = exp.splits.find(
            (s) => s.userId === otherUser._id && !s.paid
          );
          if (split) owed += split.amount;
        }
        // case 2: They paid
        if (exp.paidByUserId === otherUser._id) {
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) owing += split.amount;
        }
      }

      const mySettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined)
        )
        .collect();

      const otherUserSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", otherUser._id).eq("groupId", undefined)
        )
        .collect();

      const settlements = [...mySettlements, ...otherUserSettlements];

      for (const st of settlements) {
        if (
          st.paidByUserId === me._id &&
          st.receivedByUserId === otherUser._id
        ) {
          // You paid them → they owe you less
          owed = Math.max(0, owed - st.amount);
        } else if (
          st.paidByUserId === otherUser._id &&
          st.receivedByUserId === me._id
        ) {
          // They paid you → you owe them less
          owing = Math.max(0, owing - st.amount);
        }
      }

      return {
        type: "user",
        counterpart: {
          userId: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          imageUrl: otherUser.imageUrl,
        },
        youAreOwed: owed,
        youOwe: owing,
        netBalance: owed - owing,
      };
    } else if (args.entityType === "group") {
      const group = await ctx.db.get(args.entityId);
      if (!group) throw new Error("Group not found");

      const isMember = group.members.some((m) => m.userId === me._id);
      if (!isMember) throw new Error("You are not a member of this group");

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      const balances = {};
      group.members.forEach((m) => {
        if (m.userId !== me._id) balances[m.userId] = { owed: 0, owing: 0 };
      });

      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {
          // I paid; others may owe me
          exp.splits.forEach((split) => {
            if (split.userId !== me._id && !split.paid) {
              balances[split.userId].owed += split.amount;
            }
          });
        } else {
          if (balances[exp.paidByUserId]) {
            // Someone else in the group paid; I may owe them
            const split = exp.splits.find(
              (s) => s.userId === me._id && !s.paid
            );
            if (split) balances[exp.paidByUserId].owing += split.amount;
          }
        }
      }

      // Apply settlements within the group
      const settlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for (const st of settlements) {
        // we only care if ONE side is me
        if (st.paidByUserId === me._id && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(
            0,
            balances[st.receivedByUserId].owing - st.amount
          );
        } else if (
          st.receivedByUserId === me._id &&
          balances[st.paidByUserId]
        ) {
          balances[st.paidByUserId].owed = Math.max(
            0,
            balances[st.paidByUserId].owed - st.amount
          );
        }
      }

      const members = await Promise.all(
        Object.keys(balances).map((id) => ctx.db.get(id))
      );
      const list = Object.keys(balances).map((uid) => {
        const m = members.find((u) => u && u._id === uid);
        const { owed, owing } = balances[uid];
        return {
          userId: uid,
          name: m?.name || "Unknown",
          imageUrl: m?.imageUrl,
          youAreOwed: owed,
          youOwe: owing,
          netBalance: owed - owing,
        };
      });

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        balances: list,
      };
    }
    throw new Error("Invalid entityType; expected 'user' or 'group'");
  },
});
