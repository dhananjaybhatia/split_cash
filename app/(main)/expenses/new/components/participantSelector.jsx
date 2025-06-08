"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { UserPlus, X } from "lucide-react";
import React, { useState } from "react";

const ParticipantSelector = ({ participants, onParticipantsChange }) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  console.log(`participants are: ${participants}`);
  //Search for users API

  const { data: searchResults, isLoading: isSearching } = useConvexQuery(
    api.users.searchUsers,
    { query: searchQuery }
  );

  // Add a participant
  const addParticipant = (user) => {
    // Check if already added
    if (participants.some((p) => p.id === user.id)) {
      return;
    }

    // Add to list
    onParticipantsChange([...participants, user]);
    setCommandOpen(false);
    setSearchQuery("");
  };

  // Remove a participant
  const removeParticipant = (userId) => {
    // Don't allow removing yourself
    if (userId === currentUser._id) {
      return;
    }
    onParticipantsChange(participants.filter((p) => p.id !== userId));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {/* {currentUser && (
          <Badge variant="secondary" className="px-3 py-1">
            <Avatar className="h-5 w-5 mr-2">
              <AvatarImage src={currentUser.imageUrl} />
              <AvatarFallback>
                {currentUser.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span>{currentUser.name} (You)</span>
          </Badge>
        )} */}
        {/* selected members */}
        {participants?.map((participant) => (
          <Badge key={participant.id} variant="secondary" className="px-3 py-1">
            <Avatar className="h-5 w-5 mr-2">
              <AvatarImage src={participant.imageUrl} />
              <AvatarFallback className="bg-[#f15bb5] text-white">
                {participant.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            {participant.id !== currentUser._id ? (
              <div className="flex items-center gap-2">
                <span>{participant.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:bg-red-100 hover:text-destructive"
                  onClick={() => removeParticipant(participant.id)}
                >
                  <div className="flex h-3 w-3 items-center justify-center rounded-full border border-muted-foreground/30 hover:border-destructive/50">
                    <X className="h-2 w-2" />
                  </div>
                </Button>
              </div>
            ) : (
              <span>{participant.name} (You)</span>
            )}
          </Badge>
        ))}
        {/* add user to selected members */}
        <Popover open={commandOpen} onOpenChange={setCommandOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Person
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" side="bottom">
            <Command>
              <CommandInput
                placeholder="Search by name or email..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery.length < 2 ? (
                    <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                      Type at least 2 characters to search
                    </p>
                  ) : isSearching ? (
                    <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                      Searching...
                    </p>
                  ) : (
                    <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                      No users found.
                    </p>
                  )}
                </CommandEmpty>
                <CommandGroup heading="Users">
                  {searchResults?.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name + user.email}
                      onSelect={() => addParticipant(user)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 ">
                          {user.imageUrl ? (
                            <AvatarImage src={user.imageUrl} />
                          ) : (
                            <AvatarFallback className="bg-[#f15bb5] text-white">
                              {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ParticipantSelector;
