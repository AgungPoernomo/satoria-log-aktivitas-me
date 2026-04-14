"use client";

import { useEffect, useState } from "react";

// Struktur data sesuai dengan urutan 15 Kolom di Data_Lake
interface LogData {
  timestampKirim: string; // A
  plant: string;          // B
  dept: string;          // C
  nama: string;           // D
  tanggalBuka: string;    // E
  shift: string;          // F
  group: string;          // G
  tanggalTugas: string;   // H
  mesin: string;          // I
  area: string;           // J
  sparepart: string;      // K
  aktivitas: string;      // L
  start: any;             // M 
  end: any;               // N 
  durasi: any;            // O 
}

// Data User Login
interface UserData {
  nama: string;
  nik: string;
  departement: string;
  plant: string;
  group: string;
  foto?: string;
}

interface ChartData {
  nama: string;
  count: number;
}

export default function DashboardPage() {
  // PENTING: PASTIKAN URL INI BENAR
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";

  const [logs, setLogs] = useState<LogData[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk Modal Pop-up
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<{nama: string, logs: LogData[]} | null>(null);

  useEffect(() => {
    // 1. Ambil Data Profil User dari LocalStorage (Termasuk Foto)
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      setUserProfile(JSON.parse(storedData));
    }

    // 2. Ambil Data dari Data_Lake
    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      body: JSON.stringify({ action: "get_dashboard_data" })
    })
    .then(res => res.json())
    .then(res => {
      if (res.status === "success") {
        const mappedData: LogData[] = res.data.map((row: any[]) => ({
          timestampKirim: row[0], plant: row[1], dept: row[2], nama: row[3],
          tanggalBuka: row[4], shift: row[5], group: row[6], tanggalTugas: row[7],
          mesin: row[8], area: row[9], sparepart: row[10], aktivitas: row[11],
          start: row[12], end: row[13], durasi: row[14]
        }));

        const reversedData = mappedData.reverse();
        setLogs(reversedData);
        setFilteredLogs(reversedData);

        // Kalkulasi Chart
        const userCounts: Record<string, number> = {};
        reversedData.forEach(log => {
          if (log.nama) userCounts[log.nama] = (userCounts[log.nama] || 0) + 1;
        });
        const sortedChart = Object.entries(userCounts)
          .map(([nama, count]) => ({ nama, count }))
          .sort((a, b) => b.count - a.count);
        setChartData(sortedChart);
      }
    })
    .catch(err => console.error("Gagal load dashboard:", err))
    .finally(() => setIsLoading(false));
  }, []);

  // Filter Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = logs.filter(log => 
      log.nama?.toLowerCase().includes(lowerQuery) ||
      log.mesin?.toLowerCase().includes(lowerQuery) ||
      log.aktivitas?.toLowerCase().includes(lowerQuery)
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  // ==========================================
  // HELPER FUNCTIONS (Formatting & Fix AM/PM)
  // ==========================================
  
  // Format Tanggal (Contoh: 26 Jun 2025)
  const formatTgl = (tgl: string | Date) => {
    if (!tgl) return "-";
    const date = new Date(tgl);
    if (isNaN(date.getTime())) return String(tgl); 
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // REVISI 2: Perbaiki format waktu AM/PM atau Serial ke 24 Jam Jakarta
  const parseTimeValue = (timeVal: any): string => {
    if (!timeVal) return "-";

    if (typeof timeVal === 'object' && timeVal instanceof Date) {
      return timeVal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    if (typeof timeVal === 'number') {
      const totalMinutes = Math.round(timeVal * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const str = String(timeVal).trim();
    if (str.includes("AM") || str.includes("PM")) {
      const parts = str.match(/(\d+):(\d+):(\d+)\s*([AP]M)/i);
      if (parts) {
        let [_, hStr, mStr, sStr, apStr] = parts;
        let h = parseInt(hStr, 10);
        if (apStr.toUpperCase() === "PM" && h < 12) h += 12;
        if (apStr.toUpperCase() === "AM" && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${mStr.padStart(2, '0')}`;
      }
    }
    
    if (str.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) return str.substring(0,5);
    return str; 
  };

  // REVISI 2: Perbaiki format Durasi Desimal ke Jam.Menit (0.00)
  const parseDurationValue = (durVal: any): string => {
    if (!durVal) return "0.00";
    const str = String(durVal).trim();

    if (str.includes("Jam") || str.includes("Menit")) return str; 
    
    const num = parseFloat(str);
    if (!isNaN(num)) {
       const totalMinutes = Math.round(num * 24 * 60); 
       const h = Math.floor(totalMinutes / 60);
       const m = totalMinutes % 60;
       return `${h}.${m.toString().padStart(2, '0')}`;
    }
    return str; 
  };

  // Fix Gambar Google Drive
  const getSafeImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=800`;
    }
    return url;
  };

  // Nilai Maksimal Chart
  const maxChartCount = chartData.length > 0 ? chartData[0].count : 1;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-[#FFD32A]/30 border-t-[#FFD32A] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold animate-pulse">Menarik Data Lake...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative px-4 pb-10">
      {/* Background Glow */}
      <div className="absolute top-0 left-[10%] w-[40rem] h-[40rem] bg-[#FFD32A] rounded-full mix-blend-multiply filter blur-[150px] opacity-15 pointer-events-none"></div>

      {/* SAPAAN HEADER DENGAN FOTO PROFIL */}
      <div className="mb-8 p-6 lg:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-[#FFD32A] font-bold text-2xl shadow-inner overflow-hidden border-4 border-white flex-shrink-0">
            {userProfile?.foto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={getSafeImageUrl(userProfile.foto)} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              userProfile?.nama?.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
              Overview Tim Mechanical, {userProfile?.nama?.split(" ")[0] || "User"}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">Data real-time pusat pemantauan aktivitas Plant.</p>
          </div>
        </div>
        <div className="flex gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-inner w-full md:w-auto overflow-x-auto">
          <StatCard label="Total Log" value={logs.length} />
          <StatCard label="User Aktif" value={chartData.length} isGold />
        </div>
      </div>

      {/* MAIN GRID: AKTIVITAS & LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
        
        {/* KOLOM KIRI: AKTIVITAS TERBARU */}
        <div className="lg:col-span-2 p-6 lg:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-sm flex flex-col h-[600px] lg:h-[700px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h2>
              <p className="text-xs text-gray-500 mt-0.5">Maksimal 25 data pengiriman terbaru</p>
            </div>
            <input 
              type="text" 
              placeholder="Cari nama, mesin, area..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD32A] text-sm w-full sm:w-64 outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {filteredLogs.slice(0, 25).map((log, index) => (
              <div 
                key={index} 
                onClick={() => setSelectedLog(log)}
                className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#FFD32A]/50 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-[#FFD32A] flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0">
                      {log.nama?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-yellow-600 transition-colors truncate">{log.nama}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">{log.dept} • {log.plant} • GRP {log.group}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-gray-900">{formatTgl(log.tanggalTugas)}</p>
                    <span className="text-[10px] bg-yellow-50 px-2 py-0.5 rounded font-bold text-yellow-700 border border-yellow-100 mt-1 inline-block">{log.shift}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl mt-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-800 mb-1">🔧 {log.mesin} <span className="text-gray-400 font-medium">({log.area})</span></p>
                  <p className="text-sm text-gray-600 line-clamp-2">{log.aktivitas}</p>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-center py-10 text-gray-400 font-medium">Tidak ada data ditemukan.</div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LEADERBOARD */}
        <div className="lg:col-span-1 p-6 lg:p-8 bg-gray-900 rounded-[2rem] shadow-xl flex flex-col h-[600px] lg:h-[700px]">
          <h2 className="text-xl font-bold text-white mb-6">Leaderboard Log</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {chartData.map((user, index) => (
              <div 
                key={user.nama} 
                onClick={() => setSelectedHistoryUser({ nama: user.nama, logs: logs.filter(l => l.nama === user.nama) })}
                className="cursor-pointer group flex flex-col gap-2 relative"
              >
                <div className="flex justify-between items-center text-xs font-bold w-full">
                  <span className="text-gray-300 group-hover:text-[#FFD32A] transition-colors truncate pr-2">
                    {index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`} {user.nama}
                  </span>
                  <span className="text-[#FFD32A] bg-[#FFD32A]/10 px-2 py-0.5 rounded-md flex-shrink-0">{user.count} Log</span>
                </div>
                {/* PERBAIKAN DIAGRAM BATANG DI SINI */}
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${index < 3 ? 'bg-[#FFD32A]' : 'bg-blue-400'}`}
                    style={{ width: `${(user.count / maxChartCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABEL DATABASE */}
      <div className="p-6 lg:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-sm overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Database Log Lake (Maks 100)</h2>
        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 font-bold rounded-tl-lg">Waktu Kirim</th>
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-4 py-3 font-bold">Plant/Dept</th>
                <th className="px-4 py-3 font-bold">Tgl Tugas/Shift</th>
                <th className="px-4 py-3 font-bold">Mesin/Area</th>
                <th className="px-4 py-3 font-bold">Aktivitas</th>
                <th className="px-4 py-3 font-bold rounded-tr-lg">Durasi (Jam)</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs">
              {filteredLogs.slice(0, 100).map((log, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-white transition-colors">
                  <td className="px-4 py-3.5 text-gray-400">{formatTgl(log.timestampKirim)}</td>
                  <td className="px-4 py-3.5 font-bold text-gray-900">{log.nama}</td>
                  <td className="px-4 py-3.5">{log.plant} / {log.dept}</td>
                  <td className="px-4 py-3.5 font-bold text-gray-800">{formatTgl(log.tanggalTugas)} / {log.shift}</td>
                  <td className="px-4 py-3.5">{log.mesin} - {log.area}</td>
                  <td className="px-4 py-3.5 max-w-xs truncate" title={log.aktivitas}>{log.aktivitas}</td>
                  <td className="px-4 py-3.5 font-black text-yellow-700 bg-yellow-50 text-center rounded-lg">{parseDurationValue(log.durasi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          MODAL DETAIL DATA 
          ========================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 lg:p-8">
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Detail Aktivitas</h3>
                    <p className="text-xs text-gray-400 mt-1">Dikirim: {formatTgl(selectedLog.timestampKirim)} {selectedLog.timestampKirim?.toString().split(" ")[1] || ""}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-sm">
                <DetailRow label="TANGGAL TUGAS" value={formatTgl(selectedLog.tanggalTugas)} isGold />
                <DetailRow label="NAMA KARYAWAN" value={selectedLog.nama} />
                
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="PLANT" value={selectedLog.plant} />
                  <DetailRow label="DEPARTEMENT" value={selectedLog.dept} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="SHIFT / GROUP" value={`${selectedLog.shift} / GRP ${selectedLog.group}`} />
                  <DetailRow label="MESIN & AREA" value={`${selectedLog.mesin} (${selectedLog.area})`} />
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">AKTIVITAS / PEKERJAAN</p>
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">{selectedLog.aktivitas}</p>
                </div>

                {selectedLog.sparepart && (
                    <DetailRow label="PENGGANTIAN SPAREPART" value={selectedLog.sparepart} isHighlight />
                )}

                <div className="grid grid-cols-3 gap-3 lg:gap-4 p-4 bg-gray-900 rounded-2xl items-center text-center">
                  <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">START (JKT)</p>
                      <p className="text-lg lg:text-xl font-black text-white">{parseTimeValue(selectedLog.start)}</p>
                  </div>
                  <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">END (JKT)</p>
                      <p className="text-lg lg:text-xl font-black text-white">{parseTimeValue(selectedLog.end)}</p>
                  </div>
                  <div className="space-y-1 bg-[#FFD32A] p-2 lg:p-3 rounded-xl shadow-lg">
                      <p className="text-[10px] font-bold text-yellow-900 uppercase">DURASI</p>
                      <p className="text-xl lg:text-2xl font-black text-black">{parseDurationValue(selectedLog.durasi)} <span className="text-xs font-bold">Jam</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL RIWAYAT USER 
          ========================================== */}
      {selectedHistoryUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedHistoryUser(null)}>
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-5 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 lg:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gray-900 text-[#FFD32A] flex items-center justify-center font-bold text-xl lg:text-2xl shadow-inner flex-shrink-0">
                    {selectedHistoryUser.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="text-xl lg:text-2xl font-black text-gray-900">Riwayat Pengiriman</h3>
                    <p className="text-xs lg:text-sm font-bold text-yellow-600 uppercase tracking-widest">{selectedHistoryUser.nama}</p>
                </div>
              </div>
              <button onClick={() => setSelectedHistoryUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 bg-white flex-1">
              {selectedHistoryUser.logs.map((l, i) => (
                <div key={i} className="p-4 lg:p-5 bg-white rounded-2xl border border-gray-100 hover:border-yellow-400 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-1 rounded">{formatTgl(l.tanggalTugas)}</span>
                    <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">{parseDurationValue(l.durasi)} Jam</span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">🔧 {l.mesin} <span className="text-gray-400 font-medium">({l.area})</span></h4>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed line-clamp-2">{l.aktivitas}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFD32A; }
      `}} />
    </div>
  );
}

// Sub-Komponen StatCard
function StatCard({ label, value, isGold = false }: { label: string, value: number, isGold?: boolean }) {
    return (
        <div className="px-4 lg:px-5 py-3 rounded-xl text-center min-w-[90px] lg:min-w-[100px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`text-xl lg:text-2xl font-black ${isGold ? 'text-[#FFD32A]' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

// Sub-Komponen DetailRow
function DetailRow({ label, value, isHighlight = false, isGold = false }: { label: string, value: string, isHighlight?: boolean, isGold?: boolean }) {
  return (
    <div className={`p-3 rounded-2xl border ${isGold ? 'bg-yellow-50 border-yellow-100' : isHighlight ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${isGold ? 'text-yellow-700' : isHighlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value || "-"}
      </p>
    </div>
  );
}