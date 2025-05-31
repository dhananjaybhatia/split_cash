"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";

const SettlementList = ({
  settlements,
  userLookupMap,
  isGroupSettlement = false,
}) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  if (!settlements || settlements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No Settlements Found
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId) => {
    return {
      name:
        userId === currentUser?._id
          ? "You"
          : userLookupMap[userId]?.name || "Other User",
      id: userId,
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {settlements.map((settlement) => {
        const payer = getUserDetails(settlement.paidByUserId);
        const receiver = getUserDetails(settlement.receivedByUserId);
        const isCurrentUserPayer = settlement.paidByUserId === currentUser?._id;
        const isCurrentUserReceiver =
          settlement.receivedByUserId === currentUser?._id;

        return (
          <Card
            key={settlement._id}
            className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-medium">
                      {isCurrentUserPayer
                        ? `You paid ${receiver.name}`
                        : isCurrentUserReceiver
                          ? `${payer.name} paid you`
                          : `${payer.name} paid ${receiver.name}`}
                    </h3>
                    <div className="flex items-center gap-1  text-xs text-muted-foreground">
                      <span>
                        {format(new Date(settlement.date), "MMM d, yyyy")}
                      </span>
                      {settlement.note && (
                        <>
                          <span> • </span>
                          <span>{settlement.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">
                      ${settlement.amount.toFixed(2)}
                    </div>
                    {isGroupSettlement ? (
                      <Badge variant="outline" className="mt-1">
                        Group settlement
                      </Badge>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {isCurrentUserPayer ? (
                          <span className="text-indigo-500">You Paid</span>
                        ) : isCurrentUserReceiver ? (
                          <span className="text-amber-600">You received</span>
                        ) : (
                          <span>Payment</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SettlementList;
