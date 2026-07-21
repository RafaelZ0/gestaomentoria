import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-x-auto px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
