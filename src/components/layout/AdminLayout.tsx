import { ReactNode, useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderProfile } from "./HeaderProfile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  // Persist and control sidebar open state so it doesn't reset on navigation
  // Initialize from cookie BEFORE first render to avoid closing animation
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const cookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("sidebar:state="));
      if (cookie) {
        const value = cookie.split("=")[1];
        return value === "true";
      }
    } catch {}
    
    // Default to expanded on both mobile and desktop
    return true;
  });

  // Handle window resize to adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      // Don't force collapse on mobile - let user control sidebar state
      // This ensures consistent behavior across devices
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {/* Global header with trigger */}
          <header className="h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center min-w-0 flex-1">
              <SidebarTrigger className="ml-4 flex-shrink-0" />
              <div className="flex-1 px-4 min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">Sistema Platinum</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-4 flex-shrink-0">
              <ThemeToggle size="sm" />
              <HeaderProfile />
            </div>
          </header>
          
          <div className="p-4 lg:p-6 xl:p-8 bg-background min-w-0 overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;