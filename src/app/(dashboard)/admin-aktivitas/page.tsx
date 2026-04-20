"use client";

import { useEffect, useState } from "react";

interface ActivityLog {
  nama: string;
  nik: string;
  aktivitas: string;
  detail: string;
  waktu: string;
}

export default function AdminAktivitasPage() {
  // PENTING: PASTIKAN URL INI BENAR
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("userData") || "{}");
    
    fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "get_all_user_activity" })
    })
    .then(res => res.json())
    .then(res => {
      if (res.status === "success") {
        // 1. Simpan kamus foto
        if (res.photos) setUserPhotos(res.photos);

        // 2. Filter log (Jangan tampilkan aktivitas Admin yang sedang login)
        const filtered = res.data.filter((row: any) => String(row[1]).trim() !== String(adminData.nik).trim());
        
        // 3. Mapping data dan balikkan urutannya (Terbaru di atas)
        const formattedLogs = filtered.map((row: any) => ({
          nama: row[0], 
          nik: row[1], 
          aktivitas: row[2], 
          detail: row[3], 
          waktu: row[4]
        })).reverse();

        setLogs(formattedLogs);
        setFilteredLogs(formattedLogs);
      }
    })
    .catch(err => console.error("Gagal menarik data:", err))
    .finally(() => setIsLoading(false));
  }, []);

  // Logika Pencarian (Search)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }
    const lowerQ = searchQuery.toLowerCase();
    const result = logs.filter(log => 
      log.nama?.toLowerCase().includes(lowerQ) ||
      log.nik?.toLowerCase().includes(lowerQ) ||
      log.aktivitas?.toLowerCase().includes(lowerQ) ||
      log.detail?.toLowerCase().includes(lowerQ)
    );
    setFilteredLogs(result);
  }, [searchQuery, logs]);

  // Helper: Ambil Gambar Google Drive
  const getSafeImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=800`;
    }
    return url;
  };

  // Helper: Format Waktu agar lebih rapi
  const formatWaktu = (waktuStr: string) => {
    if (!waktuStr) return "-";
    const date = new Date(waktuStr);
    if (isNaN(date.getTime())) return waktuStr;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20 relative">
      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-[#FFD32A] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Monitoring Aktivitas 👤</h1>
          <p className="text-sm text-gray-500 mt-2">Pantau rekam jejak aktivitas semua pengguna sistem secara real-time.</p>
        </div>
        
        <div className="w-full md:w-72">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari nama, NIK, atau aksi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] transition-all text-sm font-medium shadow-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2rem] shadow-xl overflow-hidden relative z-10">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-900 text-[#FFD32A] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5 font-black rounded-tl-2xl">Waktu</th>
                <th className="px-6 py-5 font-black">Profil </th>
                <th className="px-6 py-5 font-black">Tindakan</th>
                <th className="px-6 py-5 font-black rounded-tr-2xl">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FFD32A] rounded-full animate-spin"></div>
                      Memuat data aktivitas...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">Tidak ada rekaman aktivitas yang ditemukan.</td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => {
                  const fotoUrl = userPhotos[log.nik] ? getSafeImageUrl(userPhotos[log.nik]) : "";
                  
                  // Warna Badge berdasarkan tipe aktivitas
                  let badgeColor = "bg-gray-100 text-gray-700 border-gray-200";
                  if (log.aktivitas.includes("LOGIN")) badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                  if (log.aktivitas.includes("INPUT")) badgeColor = "bg-green-50 text-green-700 border-green-200";
                  if (log.aktivitas.includes("UPDATE") || log.aktivitas.includes("UBAH")) badgeColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                  if (log.aktivitas.includes("HAPUS") || log.aktivitas.includes("DELETE")) badgeColor = "bg-red-50 text-red-700 border-red-200";

                  return (
                    <tr key={i} className="hover:bg-yellow-50/40 transition-colors">
                      <td className="px-6 py-4 text-gray-500 font-medium">{formatWaktu(log.waktu)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* FOTO USER */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 text-[#FFD32A] flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0 overflow-hidden border-2 border-white">
                            {fotoUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={fotoUrl} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              log.nama?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{log.nama}</p>
                            <p className="text-[10px] text-gray-400 font-mono font-bold tracking-wider">{log.nik}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${badgeColor}`}>
                          {log.aktivitas}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="truncate block max-w-xs xl:max-w-md">{log.detail}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global CSS Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFD32A; }
      `}} />
    </div>
  );
}