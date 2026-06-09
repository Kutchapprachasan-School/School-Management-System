import { getSystemSettings } from "@/app/actions/settings";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const initialSettings = await getSystemSettings().catch(() => ({
    schoolName: "ระบบจัดการการลา",
    subheader: "ระบบจัดการการลา",
    logoUrl: null,
    footerText: "© 2006 Panchapon Getrat KP-school"
  }));

  return <LoginForm initialSettings={initialSettings} />;
}
