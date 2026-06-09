import { getSystemSettings } from "@/app/actions/settings";
import Workspace from "./workspace";

export default async function Page() {
  const initialSettings = await getSystemSettings().catch(() => ({
    schoolName: "School OS",
    subheader: "Management System",
    logoUrl: null,
    footerText: "© 2006 Panchapon Getrat KP-school"
  }));

  return <Workspace initialSettings={initialSettings} />;
}
