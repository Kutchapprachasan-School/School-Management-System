"use client";

import React from "react";
import { UserCircle } from "lucide-react";
import ProfilePage from "@/app/eleave/profile/page";

interface ProfileViewProps {
  lang: string;
}

export default function ProfileView({ lang }: ProfileViewProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <UserCircle className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm md:text-base text-foreground">
          {lang === "th" ? "โปรไฟล์ของฉัน" : "My Profile"}
        </h3>
      </div>
      <div className="p-1 rounded-xl border border-border/60 bg-card overflow-hidden">
        <ProfilePage />
      </div>
    </div>
  );
}
