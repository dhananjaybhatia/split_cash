"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { ArrowLeft, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BarLoader } from "react-spinners";
import SettlementForm from "./components/settlementForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SettlementPage = () => {
  const params = useParams();
  const router = useRouter();
  const { type, id } = params;

  const { data, isLoading } = useConvexQuery(api.settlement.getSettlementData, {
    entityType: type,
    entityId: id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  //Function to handle after successfull settlement creation
  const handleSuccess = () => {
    // Redirect based on type
    if (type === "user") {
      router.push(`/person/${id}`);
    } else if (type === "group") {
      router.push(`/groups/${id}`);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-6 ">
      <Button
        variant="outline"
        size="sm"
        className={"hover:scale-105 "}
        onClick={() => router.back()}
      >
        <ArrowLeft />
        Back
      </Button>
      <div className="flex flex-col py-4">
        <div className="gradient-title text-5xl">Record a Settlement</div>
        <p className="text-muted-foreground">
          {type === "user"
            ? `Settling up with ${data.counterpart?.name}`
            : `Settling up with ${data.group?.name}`}
        </p>
      </div>
      <Card className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition font-mono mb-4">
        <CardHeader className="pb-2 border-b border-zinc-100 flex items-center gap-4">
          {type === "user" ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={data?.counterpart?.imageUrl} />
              <AvatarFallback className="bg-[#f15bb5] text-white">
                {data.counterpart.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="bg-primary/10 p-4 rounded-md">
              <Users />
            </div>
          )}

          <CardTitle className=" font-bold text-lg text-zinc-700 tracking-tight text-center ">
            {type === "user"
              ? `${data.counterpart?.name}`
              : `${data.group?.name}`}
          </CardTitle>
        </CardHeader>

        <CardContent className="">
          <SettlementForm
            entityType={type}
            entityData={data}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementPage;
