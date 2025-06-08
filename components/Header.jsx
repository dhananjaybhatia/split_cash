"use client";

import { useStoreUser } from "@/hooks/use-store-user";
import {
  SignedOut,
  SignedIn,
  SignOutButton,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { BarLoader } from "react-spinners";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";

const Header = () => {
  const { isLoading } = useStoreUser();
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full bg-[#EDAFB8] backdrop-blur z-50 ">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logos/logo.png"}
            alt=""
            width={200}
            height={60}
            className="h-11 w-auto object-contain"
          />
        </Link>

        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-[#4A5759] font-medium hover:text-[#2a3132] transition transform hover:scale-105"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-[#4A5759] font-medium hover:text-[#2a3132] transition transform hover:scale-105"
            >
              How It Works?
            </Link>{" "}
          </div>
        )}

        <div className="flex items-center gap-6">
          <Authenticated>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-[#4A5759] font-medium hover:text-[#2a3132] transition transform hover:scale-105"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <SignOutButton>
              <Button className="bg-[#ff0054] text-[#F7E1D7] transition transform hover:scale-105 border-none">
                Sign Out
              </Button>
            </SignOutButton>
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button
                variant={"ghost"}
                className="text-sm text-[#4A5759] hover:text-[#2a3132] transition transform hover:scale-110"
              >
                Sign In
              </Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </nav>

      {isLoading && <BarLoader width={"100%"} color="#FCD0A1" />}
    </header>
  );
};

export default Header;

