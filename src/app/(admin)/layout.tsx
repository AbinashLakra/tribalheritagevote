import { AdminConsoleShell } from '@/components/admin/AdminConsoleShell';

export const metadata = {
  title: 'Admin Console — Tribal Heritage Vote 2026',
  description: 'Authorized administrative management portal for contest timelines, video moderation, and voting auditing.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminConsoleShell>{children}</AdminConsoleShell>;
}
