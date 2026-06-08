"use client";

import { useEffect, useState } from "react";
import { getSystemInitialData } from "@/app/actions/init";
import SubstitutionTab from "@/components/timetable/SubstitutionTab";
import { UserCheck, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function SubstitutesPage() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getSystemInitialData();
      if (res.success && res.data) {
        setTeachers(res.data.teachers || []);
        setLeaveRequests(res.data.leaveRequests || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-border rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold">กำลังโหลดข้อมูลการจัดสอนแทน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            การจัดครูสอนแทนประจำวัน
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            ค้นหาและมอบหมายคุณครูเพื่อเข้าสอนแทนในกรณีที่มีคุณครูลาการสอน
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden p-6">
        <SubstitutionTab
          teachers={teachers}
          leaveRequests={leaveRequests}
          lang="th"
        />
      </div>
    </div>
  );
}
