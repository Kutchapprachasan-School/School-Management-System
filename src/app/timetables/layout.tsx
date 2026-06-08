"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function TimetableLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect /timetables/schedule -> /?menu=timetables&tab=schedule
    // Redirect /timetables/subjects -> /?menu=timetables&tab=subjects
    // Redirect /timetables -> /?menu=timetables&tab=dashboard
    const tab = pathname.replace("/timetables/", "").replace("/timetables", "dashboard");
    router.replace(`/?menu=timetables&tab=${tab}`);
  }, [pathname, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] dark:bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}
