import { requireUser } from "@/lib/auth/current-user";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
