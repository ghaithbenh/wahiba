import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";

export default function RoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
          {children}
      </main>
      <Toaster />
    </>
  );
}
