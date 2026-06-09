import { MetadataRoute } from 'next';
import { getSystemSettings } from '@/app/actions/settings';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSystemSettings().catch(() => ({
    schoolName: "School OS",
    subheader: "ระบบบริหารจัดการโรงเรียน",
    logoUrl: null
  }));

  // Use the database-configured school logo as the primary icon source, or the local icon.png fallback
  const logoSrc = settings.logoUrl || "/icon.png";

  return {
    name: settings.schoolName || 'School OS - ระบบบริหารจัดการโรงเรียนอัจฉริยะ',
    short_name: settings.schoolName || 'School OS',
    description: settings.subheader || 'ระบบปฏิบัติการโรงเรียนอัจฉริยะ ยุคใหม่ ใช้งานง่าย ข้อมูลเชื่อมโยงกันอย่างสมบูรณ์แบบ',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F7FB',
    theme_color: '#4F46E5',
    icons: [
      {
        src: logoSrc,
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  };
}
