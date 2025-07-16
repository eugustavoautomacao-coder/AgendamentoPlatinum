import { ReactNode, useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Collapse Button - Moved to layout level */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className={`fixed top-6 z-[9999] h-8 w-8 bg-card border border-border shadow-soft hover:bg-accent hover:shadow-elegant transition-all duration-200 ${
            isCollapsed ? 'left-16' : 'left-60'
          }`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
      
      {/* Header */}
      <header className={`h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300 ${
        isMobile 
          ? 'ml-0' 
          : isCollapsed 
            ? 'lg:ml-20' 
            : 'lg:ml-64'
      }`}>
        <div className="flex items-center px-4">
          <h1 className="text-lg font-semibold text-foreground">Sistema AlveX</h1>
        </div>
        <div className="flex items-center gap-2 pr-4">
          <ThemeToggle size="sm" />
        </div>
      </header>
      
      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${
          isMobile 
            ? 'ml-0' 
            : isCollapsed 
              ? 'lg:ml-20' 
              : 'lg:ml-64'
        }`}
      >
        <main className="min-h-screen p-4 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;