"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useEffect, useState } from "react";

const SplitSelector = ({
  type,
  amount,
  participants, // Now expects currentUser to already be included
  paidByUserId,
  onSplitChange,
}) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const [splits, setSplits] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!amount || amount <= 0 || participants.length === 0) return;

    let newSplits = [];

    if (type === "equal") {
      const participantCount = participants.length;
      const shareAmount = amount / participantCount;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: shareAmount,
        percentage: 100 / participantCount,
        paid: participant.id === paidByUserId,
      }));
    } else if (type === "percentage") {
      const evenPercentage = 100 / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: (amount * evenPercentage) / 100,
        percentage: evenPercentage,
        paid: participant.id === paidByUserId,
      }));
    } else if (type === "exact") {
      const evenAmount = amount / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: evenAmount,
        percentage: (evenAmount / amount) * 100,
        paid: participant.id === paidByUserId,
      }));
    }

    setSplits(newSplits);
    updateTotals(newSplits);
    onSplitChange(newSplits);
  }, [type, amount, participants, paidByUserId]);

  const updateTotals = (splits) => {
    const newTotalAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    const newTotalPercentage = splits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );
    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);
  };

  const updatePercentageSplit = (userId, newPercentage) => {
    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          percentage: newPercentage,
          amount: (amount * newPercentage) / 100,
        };
      }
      return split;
    });

    setSplits(updatedSplits);
    updateTotals(updatedSplits);
    onSplitChange(updatedSplits);
  };

  const updateExactSplit = (userId, newAmount) => {
    const parsedAmount = parseFloat(newAmount) || 0;
    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          amount: parsedAmount,
          percentage: amount > 0 ? (parsedAmount / amount) * 100 : 0,
        };
      }
      return split;
    });

    setSplits(updatedSplits);
    updateTotals(updatedSplits);
    onSplitChange(updatedSplits);
  };

  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const isAmountValid = Math.abs(totalAmount - amount) < 0.01;

  return (
    <div className="space-y-4 mt-4">
      {splits.map((split) => (
        <div
          key={split.userId}
          className="flex items-center justify-between gap-4 "
        >
          <div className="flex items-center gap-2 min-w-[120px] ">
            <Avatar className="h-7 w-7">
              {split.imageUrl ? (
                <AvatarImage src={split.imageUrl} />
              ) : (
                <AvatarFallback className="bg-[#f15bb5] text-white">
                  {split.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm">
              {split.userId === currentUser?._id
                ? `${currentUser.name} (You)`
                : split.name}
            </span>
          </div>

          {type === "equal" && (
            <div className="text-sm">
              ${split.amount.toFixed(2)} ({split.percentage.toFixed(1)}%)
            </div>
          )}

          {type === "percentage" && (
            <div className="flex items-center gap-4 flex-1">
              <Slider
                value={[split.percentage]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) =>
                  updatePercentageSplit(split.userId, value[0])
                }
              />
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={split.percentage.toFixed(2)}
                  onChange={(e) =>
                    updatePercentageSplit(
                      split.userId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-24 h-8"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <span className="text-sm">${split.amount.toFixed(1)}</span>
              </div>
            </div>
          )}

          {type === "exact" && (
            <div className="flex gap-2 items-center">
              $
              <Input
                type="number"
                min={0}
                step="0.01"
                value={split.amount.toFixed(2)}
                onChange={(e) =>
                  updateExactSplit(
                    split.userId,
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-26 h-8"
              />
              <span className="text-sm text-muted-foreground">
                ({split.percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between border-t pt-2">
        <span className="font-bold text-md">Total</span>
        <div className="text-right">
          <span
            className={`font-medium ${!isAmountValid ? "text-amber-600" : ""}`}
          >
            ${totalAmount.toFixed(2)}
          </span>
          {type !== "equal" && (
            <span
              className={`text-sm ml-2 ${!isPercentageValid ? "text-amber-600" : ""}`}
            >
              ({totalPercentage.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {!isPercentageValid && type === "percentage" && (
        <p className="text-sm text-red-500">
          Percentages must add up to 100% (Current: {totalPercentage.toFixed(2)}
          %)
        </p>
      )}
      {!isAmountValid && type === "exact" && (
        <p className="text-sm text-red-500">
          Amounts must add up to ${amount.toFixed(2)} (Current: $
          {totalAmount.toFixed(2)})
        </p>
      )}
    </div>
  );
};

export default SplitSelector;
