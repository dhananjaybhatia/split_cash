import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ExpenseSummary = ({ totalSpent, monthlySpent }) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData =
    monthlySpent?.map((item) => {
      const date = new Date(item.month);
      return {
        name: monthNames[date.getMonth()],
        amount: item.total,
      };
    }) || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  return (
    <Card className="shadow-sm hover:shadow-md transition font-mono ">
      <CardHeader>
        <CardTitle className="font-mono">
          Expense Summary - {currentYear}
        </CardTitle>
        <CardDescription>
          Total spent this year: ${totalSpent?.toFixed(2) || "0.00"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6 ">
          <div className="bg-muted rounded-lg p-4 ">
            <p className="text-sm text-muted-foreground mb-2 ">
              Current Month Spending
            </p>
            <h3 className="hover:translate-x-1 transition-transform duration-200 ease-in-out">
              ${monthlySpent?.[currentMonth]?.total?.toFixed(2) || "0.00"}
            </h3>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground  mb-2">
              Current Year Spending
            </p>
            <h3 className="hover:translate-x-1 transition-transform duration-200 ease-in-out">
              ${totalSpent?.toFixed(2) || "0.00"}
            </h3>
          </div>
        </div>
        <div style={{ height: "327px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, "Amount"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="amount" fill="#8884d8" name="Spending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseSummary;
