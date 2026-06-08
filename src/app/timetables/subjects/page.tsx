"use client";

import { useEffect, useState } from "react";
import { getSubjects, createSubject, deleteSubject } from "@/app/actions/subject";
import { BookOpen, Plus, Trash2, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function SubjectsPage() {
  const { data: session } = useSession();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadSubjects = async () => {
    setLoading(true);
    const res = await getSubjects();
    if (res.success && res.data) {
      setSubjects(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const res = await createSubject(fd);
    if (res.success) {
      e.currentTarget.reset();
      await loadSubjects();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการบันทึกรายวิชา");
    }
    setIsSubmitting(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายวิชานี้?")) return;
    const res = await deleteSubject(id);
    if (res.success) {
      await loadSubjects();
    } else {
      alert(res.error || "ไม่สามารถลบรายวิชาได้ อาจมีการใช้งานอยู่ในตารางสอน");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            จัดการรายวิชา
          </h2>
          <p className="text-muted-foreground mt-1">
            เพิ่ม แก้ไข และลบรายวิชาสำหรับใช้ในการจัดตารางสอน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isAdmin && (
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">เพิ่มรายวิชาใหม่</h3>
              {errorMsg && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg mb-4">
                  {errorMsg}
                </div>
              )}
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">รหัสวิชา</label>
                  <input type="text" name="code" placeholder="เช่น ว31101" required className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ชื่อวิชา</label>
                  <input type="text" name="name" placeholder="เช่น วิทยาศาสตร์" required className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">หน่วยกิต</label>
                    <input type="number" step="0.5" name="credit" defaultValue="1.0" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">จำนวนคาบ/สัปดาห์</label>
                    <input type="number" name="hours" defaultValue="2" required className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">สีประจำวิชา</label>
                  <input type="color" name="color" defaultValue="#3b82f6" className="w-full h-10 p-1 rounded-md border border-input cursor-pointer" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  บันทึกรายวิชา
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
                    <th className="px-6 py-4 font-medium">รหัสวิชา</th>
                    <th className="px-6 py-4 font-medium">ชื่อวิชา</th>
                    <th className="px-6 py-4 font-medium text-center">หน่วยกิต</th>
                    <th className="px-6 py-4 font-medium text-center">คาบ/สัปดาห์</th>
                    <th className="px-6 py-4 font-medium text-center">สี</th>
                    {isAdmin && <th className="px-6 py-4 font-medium text-right">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">ยังไม่มีข้อมูลรายวิชา</td>
                    </tr>
                  ) : (
                    subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{subject.code}</td>
                        <td className="px-6 py-4">{subject.name}</td>
                        <td className="px-6 py-4 text-center">{subject.credit}</td>
                        <td className="px-6 py-4 text-center">{subject.hours}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="w-6 h-6 rounded-full mx-auto shadow-sm border border-black/10" style={{ backgroundColor: subject.color || '#ccc' }} />
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteSubject(subject.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10" title="ลบรายวิชา">
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
