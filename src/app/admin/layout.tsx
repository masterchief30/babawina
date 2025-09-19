'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isDashboardPage = pathname === '/admin/dashboard';
  const isCompetitionsPage = pathname.startsWith('/admin/competitions');

  return (
    <>
      {!isLoginPage && (
        <div className="min-h-screen flex bg-gray-50">
          {/* Left Sidebar */}
          <div className="w-64 bg-slate-900 shadow-xl">
            {/* Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Floating particles */}
              <div style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                background: 'rgba(34, 197, 94, 0.6)',
                borderRadius: '50%',
                top: '20%',
                left: '15%',
                animation: 'float 4s ease-in-out infinite',
                zIndex: 2
              }}></div>
              <div style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'rgba(34, 197, 94, 0.8)',
                borderRadius: '50%',
                top: '60%',
                right: '25%',
                animation: 'float 6s ease-in-out infinite 2s',
                zIndex: 2
              }}></div>
              
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '800',
                background: 'linear-gradient(45deg, #fff, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '1px',
                position: 'relative',
                zIndex: 3
              }}>
                BabaWina ADMIN
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 space-y-2">
              <Link 
                href="/admin/dashboard"
                className={`flex items-center px-4 py-3 rounded-lg text-white transition-all duration-300 ${
                  isDashboardPage 
                    ? 'bg-emerald-600 shadow-lg transform scale-105' 
                    : 'hover:bg-slate-800 hover:transform hover:scale-105'
                }`}
              >
                <span className="font-medium">Dashboard</span>
              </Link>

              <Link 
                href="/admin/competitions"
                className={`flex items-center px-4 py-3 rounded-lg text-white transition-all duration-300 ${
                  isCompetitionsPage 
                    ? 'bg-emerald-600 shadow-lg transform scale-105' 
                    : 'hover:bg-slate-800 hover:transform hover:scale-105'
                }`}
              >
                <span className="font-medium">Create Competition</span>
              </Link>

              <Link 
                href="/admin/manage"
                className="flex items-center px-4 py-3 rounded-lg text-white transition-all duration-300 hover:bg-slate-800 hover:transform hover:scale-105"
              >
                <span className="font-medium">Manage Competitions</span>
              </Link>

              <Link 
                href="/admin/winners"
                className="flex items-center px-4 py-3 rounded-lg text-white transition-all duration-300 hover:bg-slate-800 hover:transform hover:scale-105"
              >
                <span className="font-medium">Winners</span>
              </Link>

              <Link 
                href="/admin/users"
                className="flex items-center px-4 py-3 rounded-lg text-white transition-all duration-300 hover:bg-slate-800 hover:transform hover:scale-105"
              >
                <span className="font-medium">Users</span>
              </Link>
            </nav>

          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      )}
      
      {isLoginPage && children}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
