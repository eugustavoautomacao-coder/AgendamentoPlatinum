import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from './SuperAdminSidebar';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SuperAdminSidebar />
        
        <main className="flex-1">
          {/* Global header with trigger */}
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger className="ml-4" />
            <div className="flex-1 px-4">
              <h1 className="text-lg font-semibold text-foreground">Sistema SuperAdmin</h1>
            </div>
          </header>
          
          <div className="p-6 bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;