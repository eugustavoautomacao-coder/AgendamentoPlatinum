import { useState, useEffect } from 'react';
import ProfissionalSidebar from './ProfissionalSidebar';

const ProfissionalLayout = ({ children }: { children: React.ReactNode }) => {
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
      <ProfissionalSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
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

export default ProfissionalLayout; 