"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { ArrowLeft, ArrowLeftRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { BarLoader } from "react-spinners";
import ExpenseList from "@/components/expenseList";
import SettlementList from "@/components/settlementList";

const PersonPage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }
  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4 hover:scale-105"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {" "}
            <Avatar className="h-16 w-16">
              {otherUser?.imageUrl ? (
                <AvatarImage src={otherUser?.imageUrl} />
              ) : (
                <AvatarFallback className="bg-[#f15bb5] text-white text-lg">
                  {otherUser?.name.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-4xl gradient-title">{otherUser.name}</h1>
              <p className="text-muted-foreground">{otherUser.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="bg-[#606c38] text-white hover:bg-[#81914b] transition"
            >
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight />
                Settle Up
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-[#727474] text-white hover:bg-[#5a5a5a] transition"
            >
              <Link href={`/expenses/new`}>
                <PlusCircle />
                Add expense
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono mb-4">
        <CardHeader className="pb-2 border-b border-zinc-100 flex items-center justify-between">
          <CardTitle className=" font-bold text-md text-zinc-700 tracking-tight text-center ">
            Balance
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <div>
              {" "}
              {balance === 0 ? (
                <p>You are all settled up</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-bold">{otherUser?.name}</span> owes you
                </p>
              ) : (
                <p>
                  You Owe <span className="font-bold">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-indigo-500" : "text-amber-600"}`}
            >
              ${Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlement">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonPage;
