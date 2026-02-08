import { MobileNavbar } from "@/components/navigation/MobileNavbar";
import { Sidebar } from "@/components/navigation/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          {children}
        </main>
      </div>
      <MobileNavbar />
    </>
  );
}
