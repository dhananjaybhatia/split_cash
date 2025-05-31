"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

const GroupMembers = ({ members }) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No Members In This Group
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.id === currentUser?._id;
        const isAdmin = member.role === "admin"; // Make sure your member data has 'role' field

        return (
          <div key={member.id} className="flex items-center gap-2 mb-4">
            <Avatar className="h-8 w-8">
              {member.imageUrl ? (
                <AvatarImage src={member.imageUrl} />
              ) : (
                <AvatarFallback className="bg-[#f15bb5] text-white">
                  {member.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm">{member.name}</span>

            {isAdmin && (
              <span className="text-xs text-muted-foreground">
                <Badge variant="outline" className="p-1 text-teal-600">
                  Admin
                </Badge>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupMembers;
