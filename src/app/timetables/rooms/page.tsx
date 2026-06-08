"use client";

import { useEffect, useState } from "react";
import { getRooms, createRoom, updateRoom, deleteRoom } from "@/app/actions/room";
import { DoorOpen, Plus, Edit3, Trash2, Loader2, Search, X, Save } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Room modal state
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editBuilding, setEditBuilding] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const role = (session?.user as any)?.role?.toLowerCase() || "teacher";
  const isAdmin = role === "admin" || session?.user?.email === "admin@school.os";

  const loadRooms = async () => {
    setLoading(true);
    const res = await getRooms();
    if (res.success && res.data) {
      setRooms(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const res = await createRoom(fd);
    if (res.success) {
      e.currentTarget.reset();
      await loadRooms();
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการบันทึกห้องเรียน");
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (room: any) => {
    setEditingRoom(room);
    setEditName(room.name);
    setEditBuilding(room.building || "");
    setEditErrorMsg(null);
  };

  const handleUpdateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoom) return;
    setIsUpdating(true);
    setEditErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const res = await updateRoom(editingRoom.id, fd);
    if (res.success) {
      setEditingRoom(null);
      await loadRooms();
    } else {
      setEditErrorMsg(res.error || "เกิดข้อผิดพลาดในการแก้ไขห้องเรียน");
    }
    setIsUpdating(false);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนกายภาพนี้?")) return;
    const res = await deleteRoom(id);
    if (res.success) {
      await loadRooms();
    } else {
      alert(res.error || "ไม่สามารถลบห้องเรียนได้ อาจติดใช้งานอยู่");
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.building && r.building.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DoorOpen className="h-6 w-6 text-primary" />
            จัดการห้องเรียนกายภาพ
          </h2>
          <p className="text-muted-foreground mt-1">
            เพิ่มและจัดการรายละเอียด อาคาร/สถานที่ สำหรับเรียนวิชาต่างๆ
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อห้อง หรืออาคารเรียน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Room Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 p-6 bg-card border border-border/80 rounded-2xl h-fit space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              เพิ่มห้องเรียนกายภาพใหม่
            </h3>
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                {errorMsg}
              </p>
            )}
            <form onSubmit={handleAddRoom} className="space-y-3.5 text-xs text-muted-foreground font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">ชื่อห้องเรียน</label>
                <input
                  type="text"
                  name="name"
                  placeholder="เช่น ห้องปฏิบัติการวิทยาศาสตร์ 1"
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">อาคารเรียน</label>
                <input
                  type="text"
                  name="building"
                  placeholder="เช่น อาคารวิทยาศาสตร์ (อาคาร 3)"
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                บันทึกห้องเรียน
              </button>
            </form>
          </div>
        )}

        {/* Rooms list table */}
        <div className={cn(isAdmin ? "lg:col-span-2" : "lg:col-span-3", "p-6 bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden space-y-4")}>
          <h3 className="text-sm font-bold text-foreground">
            ฐานข้อมูลอาคารสถานที่ / ห้องปฏิบัติการ
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="pb-3 px-3">ชื่อห้องเรียน</th>
                  <th className="pb-3 px-3">อาคารเรียน</th>
                  {isAdmin && <th className="pb-3 px-3 text-right">การจัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="py-8 text-center text-muted-foreground font-medium">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="py-8 text-center text-muted-foreground font-medium">
                      ยังไม่มีข้อมูลห้องเรียนกายภาพ
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-muted/30 transition-all">
                      <td className="py-3.5 px-3 font-bold text-foreground">{room.name}</td>
                      <td className="py-3.5 px-3">{room.building || "-"}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(room)}
                              className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                              title="แก้ไขห้องเรียน"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="ลบห้องเรียน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-primary" />
                แก้ไขข้อมูลห้องเรียนกายภาพ
              </h3>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateRoom} className="p-4 space-y-4 text-xs font-semibold text-muted-foreground">
              {editErrorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                  {editErrorMsg}
                </p>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">ชื่อห้องเรียน</label>
                <input
                  type="text"
                  name="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="เช่น ห้องปฏิบัติการวิทยาศาสตร์ 1"
                  required
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">อาคารเรียน</label>
                <input
                  type="text"
                  name="building"
                  value={editBuilding}
                  onChange={(e) => setEditBuilding(e.target.value)}
                  placeholder="เช่น อาคารวิทยาศาสตร์ (อาคาร 3)"
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 border border-border rounded-xl hover:bg-muted font-bold text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" /> // Wait, import Save icon or keep it simple
                  )}
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
