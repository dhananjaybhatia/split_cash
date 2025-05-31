"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArrowLeft, ArrowLeftRight, PlusCircle, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { BarLoader } from "react-spinners";
import Link from "next/link";
import ExpenseList from "@/components/expenseList";
import SettlementList from "@/components/settlementList";
import GroupBalances from "@/components/groupBalances";
import GroupMembers from "@/components/groupMembers";

const page = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(api.groups.getGroupExpenses, {
    groupId: params.id,
  });
  console.log(data);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }
  const group = data?.group;
  const members = data?.member || [];
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balances = data?.balances || [];
  const userLookupMap = data?.userLookupMap || [];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {" "}
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
            <div className="bg-primary/10 p-4 rounded-md">
              <Users className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h1 className="text-4xl gradient-title">{group?.name}</h1>
              <p className="text-muted-foreground">{group?.description}</p>
              <p className="text-sm text-muted-foreground">
                {members.length} members
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="bg-[#606c38] text-white hover:bg-[#81914b] transition"
            >
              <Link href={`/settlement/user/${params.id}`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono mb-4">
              <CardHeader className="pb-2 border-b border-zinc-100 flex items-center justify-between">
                <CardTitle className=" font-bold text-md text-zinc-700 tracking-tight text-center ">
                  Group Balance
                </CardTitle>
              </CardHeader>

              <CardContent className="">
                <GroupBalances balances={balances} />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono mb-4">
              <CardHeader className="pb-2 border-b border-zinc-100 flex items-center justify-between">
                <CardTitle className=" font-bold text-md text-zinc-700 tracking-tight text-center ">
                  Members
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <GroupMembers members={members} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={true}
            isGroupExpense={true}
            userLookupMap={userLookupMap}
          />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={userLookupMap}
            isGroupSettlement={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
