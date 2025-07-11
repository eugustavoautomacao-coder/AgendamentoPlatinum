import { ReactNode, useState, useEffect } from "react";
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
      
      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${
          isMobile 
            ? 'ml-0 pl-16' // Espaço para o botão mobile no mobile
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