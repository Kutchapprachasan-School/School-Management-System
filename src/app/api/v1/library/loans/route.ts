import { NextResponse } from "next/server";

interface LibraryLoan {
  id: string;
  studentId: string;
  studentName: string;
  bookTitle: string;
  bookIsbn: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "borrowed" | "returned" | "overdue";
}

let mockLoans: LibraryLoan[] = [
  {
    id: "loan-1",
    studentId: "std-1",
    studentName: "นายธนพล รักเรียน",
    bookTitle: "คู่มือเตรียมสอบภาษาไทย ม.6",
    bookIsbn: "978-616-08-3450-4",
    checkoutDate: "2026-05-10",
    dueDate: "2026-05-17",
    returnDate: "2026-05-16",
    status: "returned",
  },
  {
    id: "loan-2",
    studentId: "std-1",
    studentName: "นายธนพล รักเรียน",
    bookTitle: "คณิตศาสตร์ประยุกต์สู่อนาคต",
    bookIsbn: "978-616-08-1122-1",
    checkoutDate: "2026-05-20",
    dueDate: "2026-05-27",
    returnDate: null,
    status: "borrowed",
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const status = searchParams.get("status");

  let result = [...mockLoans];

  if (studentId) {
    result = result.filter(l => l.studentId === studentId);
  }

  if (status) {
    result = result.filter(l => l.status === status);
  }

  return NextResponse.json({
    success: true,
    data: result,
    message: "ดึงข้อมูลการยืม-คืนหนังสือห้องสมุดสำเร็จ"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, loanId, studentId, studentName, bookTitle, bookIsbn } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุ action ('checkout' หรือ 'return')" } },
        { status: 400 }
      );
    }

    if (action === "checkout") {
      if (!studentId || !studentName || !bookTitle) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุข้อมูลนักเรียนและชื่อหนังสือสำหรับยืม" } },
          { status: 400 }
        );
      }

      const today = new Date();
      const due = new Date();
      due.setDate(today.getDate() + 7); // 7 days loan policy

      const newLoan: LibraryLoan = {
        id: `loan-${Date.now()}`,
        studentId,
        studentName,
        bookTitle,
        bookIsbn: bookIsbn || "ISBN-PENDING",
        checkoutDate: today.toISOString().substring(0, 10),
        dueDate: due.toISOString().substring(0, 10),
        returnDate: null,
        status: "borrowed",
      };

      mockLoans.unshift(newLoan);

      return NextResponse.json({
        success: true,
        data: newLoan,
        message: `ทำรายการยืมหนังสือ "${bookTitle}" ให้กับคุณ ${studentName} สำเร็จ`
      });
    }

    if (action === "return") {
      if (!loanId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "กรุณาระบุรหัสเอกสารการยืม (loanId) เพื่อทำการคืน" } },
          { status: 400 }
        );
      }

      const loanIndex = mockLoans.findIndex(l => l.id === loanId);
      if (loanIndex === -1) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "ไม่พบประวัติการยืมรหัสนี้" } },
          { status: 404 }
        );
      }

      mockLoans[loanIndex].returnDate = new Date().toISOString().substring(0, 10);
      mockLoans[loanIndex].status = "returned";

      return NextResponse.json({
        success: true,
        data: mockLoans[loanIndex],
        message: `ทำรายการคืนหนังสือ "${mockLoans[loanIndex].bookTitle}" สำเร็จเรียบร้อย`
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "action ไม่ถูกต้อง" } },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
