"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import React from "react";
import { BarLoader } from "react-spinners";
import ExpenseSummary from "./components/expenseSummary";
import BalanceSummary from "./components/balanceSummary";
import GroupList from "./components/groupList";

const page = () => {
  const { data: balances, isLoading: balanceLoading } = useConvexQuery(
    api.dashboard.getUserBalance
  );
  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );
  const { data: monthlySpent, isLoading: monthlySpentLoading } = useConvexQuery(
    api.dashboard.getMonthlySpending
  );
  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );

  const isLoading =
    balanceLoading || totalSpentLoading || monthlySpentLoading || groupsLoading;

  return (
    <div className="container mx-auto py-6 space-y-6 font-mono">
      {isLoading ? (
        <div className="w-full py-12 flex justify-center">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-5xl gradient-title">Dashboard</h1>
            <Button
              asChild
              className="bg-[#727474] text-white hover:bg-[#2f5e56] transition hover:scale-105"
            >
              <Link href="/expenses/new">
                <PlusCircle className="mr-2" />
                Add Expenses
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 🟣 Total Balance Card */}
            <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-2 border-b border-zinc-100">
                <CardTitle className="text-md font-semibold text-zinc-700 tracking-tight text-center">
                  Total Balance
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="text-3xl font-extrabold text-center tracking-tight">
                  {balances.totalBalance > 0 ? (
                    <span className="text-indigo-600">
                      +${balances.totalBalance.toFixed(2)}
                    </span>
                  ) : balances.totalBalance < 0 ? (
                    <span className="text-amber-600">
                      -${Math.abs(balances.totalBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-500">$0.00</span>
                  )}
                </div>
                <p
                  className={`text-sm text-center mt-2 ${
                    balances?.totalBalance > 0
                      ? "text-[#1b4965]"
                      : balances?.totalBalance < 0
                        ? "text-[#dd2d4a]"
                        : "text-[#3c6e71]"
                  }`}
                >
                  {balances?.totalBalance > 0
                    ? "Others owe you"
                    : balances?.totalBalance < 0
                      ? "You owe others"
                      : "All settled up!"}
                </p>
              </CardContent>
            </Card>

            {/* 🟢 You Are Owed Card */}
            <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-2 border-b border-zinc-100">
                <CardTitle className="text-md font-semibold text-zinc-700 tracking-tight text-center font-mono">
                  Others owe you
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="text-3xl font-extrabold text-center tracking-tight text-indigo-600">
                  ${balances?.youAreOwed?.toFixed(2) || "0.00"}
                </div>
                <p className="text-sm text-center mt-2 text-[#1b4965]">
                  From {balances?.oweDetails?.youAreOwedBy?.length || 0} people
                </p>
              </CardContent>
            </Card>

            {/* 🔴 You Owe Card */}
            <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-2 border-b border-zinc-100">
                <CardTitle className="text-md font-semibold text-zinc-700 tracking-tight text-center font-mono">
                  You Owe Others
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                {balances?.oweDetails?.youOwe?.length > 0 ? (
                  <>
                    <div className="text-3xl font-extrabold text-center tracking-tight text-amber-600">
                      $
                      {balances?.youOwe?.toFixed(2) || "0.00"}
                    </div>
                    <p className="text-sm text-center mt-2 text-[#dd2d4a]">
                      To {balances?.oweDetails?.youOwe?.length} people
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-center tracking-tight text-slate-500">
                      $0.00
                    </div>
                    <p className="text-sm text-center mt-2 text-[#3c6e71]">
                      You don’t owe anyone
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ExpenseSummary
                totalSpent={totalSpent}
                monthlySpent={monthlySpent}
              />
            </div>
            <div className="space-y-4">
              <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono">
                <CardHeader className="pb-2 border-b border-zinc-100 flex items-center justify-between">
                  <CardTitle className="text-md font-semibold text-zinc-700 tracking-tight text-center ">
                    Balance Details
                  </CardTitle>
                  <Button variant="link" asChild className="p-0">
                    <Link href="/contacts">
                      View All
                      <ChevronRight className="ml-1" />
                    </Link>
                  </Button>
                </CardHeader>

                <CardContent className="pt-4">
                  <BalanceSummary balances={balances} />
                </CardContent>
              </Card>

              <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition ">
                <CardHeader className="pb-2 border-b border-zinc-100 flex items-center justify-between">
                  <CardTitle className="text-md font-semibold text-zinc-700 tracking-tight text-center font-mono">
                    Your Groups
                  </CardTitle>
                  <Button variant="link" asChild className="p-0">
                    <Link href="/contacts">
                      View All
                      <ChevronRight className="ml-1" />
                    </Link>
                  </Button>
                </CardHeader>

                <CardContent className="pt-1.5">
                  <GroupList groups={groups} />
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full bg-[#9A9175] hover:bg-[#827a63] text-lg hover:scale-105"
                  >
                    <Link href="/contacts?createGroup=true">
                      <Users className="mr-2 h-4 w-4" /> Create New Group
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default page;
