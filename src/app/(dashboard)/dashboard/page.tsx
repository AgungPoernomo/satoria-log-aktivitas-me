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
  
  // STATE BARU: Menyimpan kamus foto semua karyawan dari access_control
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // STATE FILTER MULTI-VARIABEL (Tanpa Tanggal)
  // ==========================================
  const [filters, setFilters] = useState({
    group: "",
    dept: "",
    plant: "",
    shift: "",
    mesin: ""
  });

  // State untuk Modal Pop-up
  const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<{nama: string, logs: LogData[]} | null>(null);

  useEffect(() => {
    // 1. Ambil Data Profil User dari LocalStorage
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      setUserProfile(JSON.parse(storedData));
    }

    // 2. Ambil Data dari Data_Lake & Foto dari access_control
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
        
        // Simpan data foto dari server ke dalam state
        if (res.photos) {
          setUserPhotos(res.photos);
        }
      }
    })
    .catch(err => console.error("Gagal load dashboard:", err))
    .finally(() => setIsLoading(false));
  }, []);

  // ==========================================
  // LOGIKA PENCARIAN, FILTER & UPDATE CHART
  // ==========================================
  useEffect(() => {
    let result = logs;

    // 1. Filter dari Input Search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.nama?.toLowerCase().includes(lowerQuery) ||
        log.mesin?.toLowerCase().includes(lowerQuery) ||
        log.aktivitas?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Filter dari Dropdown (Tanggal dihapus)
    if (filters.group) result = result.filter(l => l.group === filters.group);
    if (filters.dept) result = result.filter(l => l.dept === filters.dept);
    if (filters.plant) result = result.filter(l => l.plant === filters.plant);
    if (filters.shift) result = result.filter(l => l.shift === filters.shift);
    if (filters.mesin) result = result.filter(l => l.mesin === filters.mesin);

    // Terapkan ke Tabel dan List
    setFilteredLogs(result);

    // 3. Kalkulasi Ulang Chart (Leaderboard) Berdasarkan Filter
    const userCounts: Record<string, number> = {};
    result.forEach(log => {
      if (log.nama) userCounts[log.nama] = (userCounts[log.nama] || 0) + 1;
    });
    const sortedChart = Object.entries(userCounts)
      .map(([nama, count]) => ({ nama, count }))
      .sort((a, b) => b.count - a.count);
    setChartData(sortedChart);

  }, [searchQuery, filters, logs]);

  // Fungsi Reset Filter
  const handleResetFilters = () => {
    setFilters({ group: "", dept: "", plant: "", shift: "", mesin: "" });
    setSearchQuery("");
  };

  // ==========================================
  // HELPER FUNCTIONS (Formatting & Fix Waktu)
  // ==========================================
  
  const formatTgl = (tgl: string | Date) => {
    if (!tgl) return "-";
    const date = new Date(tgl);
    if (isNaN(date.getTime())) return String(tgl); 
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const parseTimeValue = (timeVal: any): string => {
    if (!timeVal) return "-";
    if (typeof timeVal === 'object' && timeVal instanceof Date) return timeVal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (typeof timeVal === 'number') {
      const totalMinutes = Math.round(timeVal * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    const str = String(timeVal).trim();
    if (str.includes("T") && str.includes("-")) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (str.includes("AM") || str.includes("PM")) {
      const parts = str.match(/(\d+):(\d+):(\d+)\s*([AP]M)/i) || str.match(/(\d+):(\d+)\s*([AP]M)/i);
      if (parts) {
        let h = parseInt(parts[1], 10);
        let mStr = parts[2];
        let apStr = parts[parts.length - 1]; 
        if (apStr.toUpperCase() === "PM" && h < 12) h += 12;
        if (apStr.toUpperCase() === "AM" && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${mStr.padStart(2, '0')}`;
      }
    }
    if (str.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) return str.substring(0,5);
    return str; 
  };

  const parseDurationValue = (durVal: any): string => {
    if (!durVal && durVal !== 0) return "0.00";
    const str = String(durVal).trim();
    if (str.includes("Jam") || str.includes("Menit") || str.includes("jam")) return str; 
    if (str.includes("T") && str.includes("-")) {
       const d = new Date(str);
       if (!isNaN(d.getTime())) return `${d.getUTCHours()}.${d.getUTCMinutes().toString().padStart(2, '0')}`;
    }
    const num = parseFloat(str);
    if (!isNaN(num)) return num.toFixed(2);
    return str; 
  };

  const getSafeImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=800`;
    }
    return url;
  };

  // LOGIKA FOTO BARU: Mengambil dari Dictionary Data access_control
  const getLogUserPhoto = (logNama: string) => {
    // 1. Cek di state userPhotos yang ditarik dari server
    if (userPhotos[logNama]) {
      return getSafeImageUrl(userPhotos[logNama]);
    }
    // 2. Fallback: Jika gagal/belum termuat, cek apakah itu user yg sedang login
    if (userProfile && logNama === userProfile.nama && userProfile.foto) {
      return getSafeImageUrl(userProfile.foto);
    }
    // 3. Jika tidak ada sama sekali
    return "";
  };

  // Pengecekan Dropdown Dinamis dari data master (logs)
  const uniqueGroup = Array.from(new Set(logs.map(l => l.group))).filter(Boolean);
  const uniqueDept = Array.from(new Set(logs.map(l => l.dept))).filter(Boolean);
  const uniquePlant = Array.from(new Set(logs.map(l => l.plant))).filter(Boolean);
  const uniqueShift = Array.from(new Set(logs.map(l => l.shift))).filter(Boolean);
  const uniqueMesin = Array.from(new Set(logs.map(l => l.mesin))).filter(Boolean);

  const maxChartCount = chartData.length > 0 ? chartData[0].count : 1;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-[#FFD32A]/30 border-t-[#FFD32A] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold animate-pulse">Loading..</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative px-4 pb-10">
      {/* Background Glow */}
      <div className="absolute top-0 left-[10%] w-[40rem] h-[40rem] bg-[#FFD32A] rounded-full mix-blend-multiply filter blur-[150px] opacity-15 pointer-events-none"></div>

      {/* SAPAAN HEADER DENGAN FOTO PROFIL */}
      <div className="mb-6 p-6 lg:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
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
          <StatCard label="Filter Aktif" value={filteredLogs.length} isGold />
          <StatCard label="Total Log" value={logs.length} />
        </div>
      </div>

      {/* ==========================================
          SECTION FILTER (TANGGAL DIHAPUS, GRID DISESUAIKAN)
          ========================================== */}
      <div className="mb-8 p-6 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">Dashboard Filters</h2>
          {(filters.group || filters.dept || filters.plant || filters.shift || filters.mesin || searchQuery) && (
            <button onClick={handleResetFilters} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
              ✖ Reset Semua Filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterSelect label="Plant" value={filters.plant} options={uniquePlant} onChange={(val) => setFilters({...filters, plant: val})} />
          <FilterSelect label="Departement" value={filters.dept} options={uniqueDept} onChange={(val) => setFilters({...filters, dept: val})} />
          <FilterSelect label="Group" value={filters.group} options={uniqueGroup} onChange={(val) => setFilters({...filters, group: val})} />
          <FilterSelect label="Shift" value={filters.shift} options={uniqueShift} onChange={(val) => setFilters({...filters, shift: val})} />
          <FilterSelect label="Mesin" value={filters.mesin} options={uniqueMesin} onChange={(val) => setFilters({...filters, mesin: val})} />
        </div>
      </div>

      {/* MAIN GRID: AKTIVITAS & LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 relative z-10">
        
        {/* KOLOM KIRI: AKTIVITAS TERBARU */}
        <div className="lg:col-span-2 p-6 lg:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-sm flex flex-col h-[600px] lg:h-[700px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h2>
              <p className="text-xs text-gray-500 mt-0.5">Sesuai filter ({filteredLogs.length} hasil)</p>
            </div>
            <input 
              type="text" 
              placeholder="Cari nama, mesin, aktivitas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD32A] text-sm w-full sm:w-64 outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {filteredLogs.slice(0, 25).map((log, index) => {
              const fotoUrl = getLogUserPhoto(log.nama);
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedLog(log)}
                  className="bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#FFD32A]/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* IMPLEMENTASI FOTO USER DARI SERVER */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-[#FFD32A] flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 overflow-hidden border border-gray-200">
                        {fotoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={fotoUrl} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          log.nama?.charAt(0).toUpperCase()
                        )}
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
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="text-center py-10 text-gray-400 font-medium">Tidak ada data ditemukan. Coba sesuaikan filter Anda.</div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LEADERBOARD */}
        <div className="lg:col-span-1 p-6 lg:p-8 bg-gray-900 rounded-[2rem] shadow-xl flex flex-col h-[600px] lg:h-[700px] relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Leaderboard</h2>
            <p className="text-xs text-gray-400 mb-6">User aktif berdasarkan filter saat ini.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {chartData.map((user, index) => {
              const fotoUrl = getLogUserPhoto(user.nama);
              return (
                <div 
                  key={user.nama} 
                  onClick={() => setSelectedHistoryUser({ nama: user.nama, logs: filteredLogs.filter(l => l.nama === user.nama) })}
                  className="cursor-pointer group flex flex-col gap-2 relative"
                >
                  <div className="flex justify-between items-center text-xs font-bold w-full gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-gray-400 w-4">{index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}`}</span>
                      
                      {/* FOTO DI LEADERBOARD */}
                      <div className="w-6 h-6 rounded-full bg-gray-700 text-[#FFD32A] flex items-center justify-center font-bold text-[10px] overflow-hidden flex-shrink-0">
                        {fotoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={fotoUrl} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user.nama?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <span className="text-gray-300 group-hover:text-[#FFD32A] transition-colors truncate">
                        {user.nama}
                      </span>
                    </div>
                    <span className="text-[#FFD32A] bg-[#FFD32A]/10 px-2 py-0.5 rounded-md flex-shrink-0">{user.count} Log</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${index < 3 ? 'bg-[#FFD32A]' : 'bg-blue-400'}`}
                      style={{ width: `${(user.count / maxChartCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {chartData.length === 0 && (
              <div className="text-center py-5 text-gray-500 text-sm">Tidak ada yang aktif.</div>
            )}
          </div>
        </div>
      </div>

      {/* TABEL DATABASE */}
      <div className="p-6 lg:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-sm overflow-hidden relative z-10">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tabel Aktivitas</h2>
        <p className="text-xs text-gray-500 mb-6">Menampilkan hasil berdasarkan filter yang aktif.</p>
        
        {/* REVISI 1: Tambahkan relative dan max-h untuk membatasi tinggi tabel agar bisa di-scroll dan sticky berjalan */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar pb-4 relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            {/* REVISI 1: Tambahkan sticky top-0 dan z-index agar header menempel */}
            <thead className="text-xs text-gray-400 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-bold rounded-tl-lg">Waktu Kirim</th>
                <th className="px-4 py-3 font-bold">Karyawan</th>
                <th className="px-4 py-3 font-bold">Plant/Dept</th>
                <th className="px-4 py-3 font-bold">Tgl Tugas/Shift</th>
                <th className="px-4 py-3 font-bold">Mesin/Area</th>
                <th className="px-4 py-3 font-bold">Aktivitas</th>
                <th className="px-4 py-3 font-bold rounded-tr-lg">Durasi (Jam)</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs">
              {filteredLogs.slice(0, 100).map((log, i) => {
                const fotoUrl = getLogUserPhoto(log.nama);
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-white transition-colors">
                    <td className="px-4 py-3.5 text-gray-400">{formatTgl(log.timestampKirim)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* FOTO DI TABEL */}
                        <div className="w-6 h-6 rounded-full bg-gray-800 text-[#FFD32A] flex items-center justify-center font-bold text-[10px] overflow-hidden flex-shrink-0">
                          {fotoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={fotoUrl} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            log.nama?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-gray-900">{log.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{log.plant} / {log.dept}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-800">{formatTgl(log.tanggalTugas)} / {log.shift}</td>
                    <td className="px-4 py-3.5">{log.mesin} - {log.area}</td>
                    <td className="px-4 py-3.5 max-w-xs truncate" title={log.aktivitas}>{log.aktivitas}</td>
                    <td className="px-4 py-3.5 font-black text-yellow-700 bg-yellow-50 text-center rounded-lg">{parseDurationValue(log.durasi)}</td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Tidak ada data untuk ditampilkan.</td></tr>
              )}
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
                    <DetailRow label="SPAREPART" value={selectedLog.sparepart} isHighlight />
                )}

                <div className="grid grid-cols-3 gap-3 lg:gap-4 p-4 bg-gray-900 rounded-2xl items-center text-center">
                  <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">START (WIB)</p>
                      <p className="text-lg lg:text-xl font-black text-white">{parseTimeValue(selectedLog.start)}</p>
                  </div>
                  <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">END (WIB)</p>
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
                {/* FOTO DI MODAL RIWAYAT */}
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gray-900 text-[#FFD32A] flex items-center justify-center font-bold text-xl lg:text-2xl shadow-inner flex-shrink-0 overflow-hidden">
                    {getLogUserPhoto(selectedHistoryUser.nama) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={getLogUserPhoto(selectedHistoryUser.nama)} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      selectedHistoryUser.nama.charAt(0).toUpperCase()
                    )}
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

// Sub-Komponen Dropdown Filter
function FilterSelect({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (val: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 mb-1 ml-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#FFD32A] outline-none font-medium appearance-none cursor-pointer hover:border-gray-300"
      >
        <option value="">Semua</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
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