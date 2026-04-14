"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserData {
  nama: string;
  departement: string;
  foto?: string;
}

// Menerima props dari layout
export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  const loadUser = () => {
    const storedData = localStorage.getItem("userData");
    if (storedData) setUser(JSON.parse(storedData));
  };

  useEffect(() => {
    loadUser();
    // Mendengarkan trigger custom event agar foto langsung update
    window.addEventListener('storage', loadUser);
    window.addEventListener('userUpdated', loadUser); 
    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('userUpdated', loadUser);
    };
  }, []);

  // Trik Google Drive Image
  const getSafeImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
    }
    return url;
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar dari sistem?")) {
      localStorage.removeItem("userData");
      router.push("/login");
    }
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Log Aktivitas", href: "/log-aktivitas", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { name: "Pengaturan", href: "/pengaturan", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <>
      {/* Overlay Gelap untuk HP saat sidebar terbuka */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 left-0 z-50 w-72 h-screen bg-white/90 backdrop-blur-3xl border-r border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        <div className="h-20 lg:h-24 flex items-center justify-between lg:justify-center border-b border-gray-100 px-6">
          <Link href="/dashboard" className="transition-transform hover:scale-105" onClick={() => setIsOpen(false)}>
            <Image src="/logo-satoria.png" alt="Logo Satoria" width={160} height={50} className="object-contain max-h-10 lg:max-h-12 w-auto" priority />
          </Link>
          {/* Tombol Tutup di HP */}
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Menu Utama</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} href={item.href} 
                onClick={() => setIsOpen(false)} // Tutup sidebar HP saat menu diklik
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${isActive ? "bg-[#FFD32A] text-black shadow-md shadow-yellow-400/20" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                <svg className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}></path></svg>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 pb-8 lg:pb-4">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-[#FFD32A] font-bold text-lg shadow-inner overflow-hidden flex-shrink-0">
                {user.foto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={getSafeImageUrl(user.foto)} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  user.nama.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{user.nama}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{user.departement}</p>
              </div>
            </div>
          )}

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Keluar Sistem
          </button>
        </div>
      </aside>
    </>
  );
}