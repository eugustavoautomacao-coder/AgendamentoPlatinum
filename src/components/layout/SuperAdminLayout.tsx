import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeaderProfile } from "./HeaderProfile";
import { SuperAdminSidebar } from './SuperAdminSidebar';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <SuperAdminSidebar />
        
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
          
          <div className="p-6 bg-background min-w-0 overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;