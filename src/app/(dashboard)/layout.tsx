"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk mode HP

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Utama";
    if (pathname === "/log-aktivitas") return "Log Aktivitas Harian";
    if (pathname === "/pengaturan") return "Pengaturan Sistem";
    return "User Management";
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-gray-900 relative">
      
      {/* Sidebar - Di-passing state agar bisa ditutup/buka di HP */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col lg:ml-72 min-h-screen w-full transition-all duration-300">
        
        {/* Header Responsive */}
        <header className="h-20 lg:h-24 bg-[#FFD32A] backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Tombol Hamburger (Hanya muncul di HP/Tablet) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 tracking-tight">
                {getPageTitle()}
              </h2>
              <p className="text-xs lg:text-sm font-medium text-[#FAFAFA] mt-0.5 hidden sm:block">
                Sistem Manajemen Pelaporan Aktivitas Harian Personil dan Mesin
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200">
            <span className="text-sm font-bold text-gray-600">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full max-w-[100vw] lg:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}