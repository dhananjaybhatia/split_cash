import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryById, getCategoryIcon } from "@/lib/expenseCategories";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ExpenseList = ({
  expenses,
  showOtherPerson = true,
  isGroupExpense = false,
  otherPersonId = null,
  userLookupMap = {},
}) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const deleteExpense = useConvexMutation(api.expenses.deleteExpenses);

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No Expenses Found
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId) => {
    return {
      name:
        userId === currentUser?.id
          ? "You"
          : userLookupMap[userId]?.name || "Other User",
      id: userId,
    };
  };

  const canDeleteExpense = (expense) => {
    if (!currentUser) return false;
    return (
      expense.createdBy === currentUser._id ||
      expense.paidByUserId === currentUser._id
    );
  };

  const handleDeleteExpense = async (expense) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense? This action cannot be undone."
    );

    if (!confirmed) return;
    try {
      await deleteExpense.mutate({ expenseId: expense._id });
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense: " + error.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense) => {
        const payer = getUserDetails(expense);
        const isCurrentUserPayer = expense.paidByUserId === currentUser?._id;
        const category = getCategoryById(expense.category);
        const CategoryIcon = getCategoryIcon(category.id);
        const showDeleteOption = canDeleteExpense(expense);

        return (
          <Card
            key={expense._id}
            className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3>{expense.description}</h3>
                    <h2>{format(new Date(expense.date), "MMM d, yyyy")}</h2>
                    {showOtherPerson && (
                      <>
                        <span> • </span>
                        <span>{isCurrentUserPayer ? "You" : payer.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">
                      ${expense.amount.toFixed(2)}
                    </div>
                    {isGroupExpense ? (
                      <Badge variant="outline" className="mt-1">
                        Group Expense
                      </Badge>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {isCurrentUserPayer ? (
                          <span className="text-indigo-500">You Paid</span>
                        ) : (
                          <span className="text-amber-600">
                            {payer.name} Paid
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {showDeleteOption && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleDeleteExpense(expense)}
                    >
                      <Trash2 />
                      <span className="sr-only">Delete expense</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm flex gap-2 flex-wrap">
                {expense.splits?.map((split) => {
                  const splitUser = getUserDetails(split.userId);
                  const isCurrentUser = split.userId === currentUser?._id;
                  const displayName = isCurrentUser ? "You" : splitUser.name;

                  // Get proper initials
                  const getInitials = () => {
                    if (isCurrentUser && currentUser?.name) {
                      return currentUser.name.charAt(0).toUpperCase();
                    }
                    if (!splitUser.name) return "?";
                    return splitUser.name.charAt(0).toUpperCase();
                  };

                  return (
                    <Badge
                      key={split.userId}
                      className="flex items-center gap-2 px-2 py-1 text-xs "
                      variant={split.paid ? "outline" : "secondary"}
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarFallback
                          className={`text-sm font-medium ${isCurrentUser ? "bg-[#99582a] text-[#ffe6a7]" : "bg-[#f15bb5] text-white"}`}
                        >
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="whitespace-nowrap inline-flex items-baseline">
                        {displayName}: ${split.amount.toFixed(2)}
                        {split.paid && (
                          <span className="ml-1 text-green-600 inline-block relative -top-px">
                            ✓
                          </span>
                        )}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExpenseList;
