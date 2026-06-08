"use client";

import { useEffect, useState } from "react";
import { getClassrooms, createClassroom, deleteClassroom } from "@/app/actions/classroom";
import { Users, Plus, Trash2, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function ClassroomsPage() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadClassrooms = async () => {
    setLoading(true);
    const res = await getClassrooms();
    if (res.success && res.data) {
      setClassrooms(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleAddClassroom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const res = await createClassroom(fd);
    if (res.success) {
      e.currentTarget.reset();
      await loadClassrooms();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการบันทึกชั้นเรียน");
    }
    setIsSubmitting(false);
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบชั้นเรียนนี้?")) return;
    const res = await deleteClassroom(id);
    if (res.success) {
      await loadClassrooms();
    } else {
      alert(res.error || "ไม่สามารถลบชั้นเรียนได้ อาจมีการใช้งานอยู่ในตารางสอน");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            จัดการชั้นเรียน
          </h2>
          <p className="text-muted-foreground mt-1">
            เพิ่มและจัดการข้อมูลชั้นเรียนที่ใช้ในการจัดตารางสอน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isAdmin && (
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">เพิ่มชั้นเรียนใหม่</h3>
              {errorMsg && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg mb-4">
                  {errorMsg}
                </div>
              )}
              <form onSubmit={handleAddClassroom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ชื่อชั้นเรียน</label>
                  <input type="text" name="name" placeholder="เช่น ม.1/1" required className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">ระดับชั้น</label>
                    <input type="text" name="grade" placeholder="เช่น ม.1" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">ห้อง</label>
                    <input type="text" name="room" placeholder="เช่น 1" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  บันทึกชั้นเรียน
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">ชื่อชั้นเรียน</th>
                    <th className="px-6 py-4 font-medium text-center">ระดับชั้น</th>
                    <th className="px-6 py-4 font-medium text-center">ห้อง</th>
                    {isAdmin && <th className="px-6 py-4 font-medium text-right">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : classrooms.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-muted-foreground">ยังไม่มีข้อมูลชั้นเรียน</td>
                    </tr>
                  ) : (
                    classrooms.map((cls) => (
                      <tr key={cls.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{cls.name}</td>
                        <td className="px-6 py-4 text-center">{cls.grade || "-"}</td>
                        <td className="px-6 py-4 text-center">{cls.room || "-"}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteClassroom(cls.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10" title="ลบชั้นเรียน">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
