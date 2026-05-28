import { getSubjects, createSubject, deleteSubject } from "@/app/actions/subject";
import { BookOpen, Plus, Trash2 } from "lucide-react";

export default async function SubjectsPage() {
  const result = await getSubjects();
  const subjects = result.success ? result.data || [] : [];

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
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-4">เพิ่มรายวิชาใหม่</h3>
            <form action={createSubject as any} className="space-y-4">
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
              <button type="submit" className="w-full inline-flex justify-center items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors mt-2">
                <Plus className="mr-2 h-4 w-4" /> บันทึกรายวิชา
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
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
                    <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">ยังไม่มีข้อมูลรายวิชา</td>
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
                        <td className="px-6 py-4 text-right">
                          <form action={async () => {
                            "use server";
                            await deleteSubject(subject.id);
                          }}>
                            <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10" title="ลบรายวิชา">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </td>
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
