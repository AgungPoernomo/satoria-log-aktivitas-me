"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  nama: string;
  nik: string;
  group: string;
  departement: string;
  plant: string;
  foto?: string;
}

interface DraftLog {
  id: number;
  tanggalTugas: string;
  plant: string;
  group: string;
  shift: string;
  mesin: string;
  area: string;
  sparepart: string;
  aktivitas: string;
  start: string;
  end: string;
  durasi: string;
}

export default function LogAktivitasPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  
  // State Validation Data
  const [validation, setValidation] = useState({
    groups: [] as string[],
    plants: [] as string[],
    shifts: [] as string[],
    mesins: [] as string[],
    areasMap: {} as Record<string, string[]> 
  });

  // State Form (Group & Plant dihapus dari sini karena akan diambil otomatis dari userData)
  const [form, setForm] = useState({
    shift: "", tanggalTugas: "",
    mesin: "", area: "", sparepart: "", aktivitas: "", start: "", end: ""
  });

  // MULTIPLE UPLOAD: State Keranjang / Draft
  const [draftLogs, setDraftLogs] = useState<DraftLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";

  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (!storedData) {
      router.push("/login");
      return;
    }
    const parsedData = JSON.parse(storedData);
    setUserData(parsedData);
    
    const today = new Date();
    setTanggalMasuk(today.toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }));

    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_log_validation" })
    })
    .then(res => res.json())
    .then(res => {
      if (res.status === "success") setValidation(res.data);
    })
    .catch(err => console.error("Gagal memuat data dropdown:", err));
  }, [router]);

  const calculateDurasi = () => {
    if (!form.start || !form.end) return "";
    const [startH, startM] = form.start.split(':').map(Number);
    const [endH, endM] = form.end.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return "";

    let startTotal = (startH * 60) + startM;
    let endTotal = (endH * 60) + endM;
    if (endTotal < startTotal) endTotal += 24 * 60; 
    
    const diff = endTotal - startTotal;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}.${m.toString().padStart(2, '0')}`;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      if (name === "mesin") newForm.area = ""; 
      return newForm;
    });
  };

  // MULTIPLE UPLOAD: Tambah ke Draft
  const handleAddToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    const durasi = calculateDurasi();
    
    const newLog: DraftLog = {
      id: Date.now(),
      tanggalTugas: form.tanggalTugas,
      shift: form.shift,
      plant: userData.plant, // Mengambil otomatis dari identitas user
      group: userData.group, // Mengambil otomatis dari identitas user
      mesin: form.mesin,
      area: form.area,
      sparepart: form.sparepart,
      aktivitas: form.aktivitas,
      start: form.start,
      end: form.end,
      durasi: durasi || "0.00"
    };

    setDraftLogs([...draftLogs, newLog]);
    
    // Reset bagian detail pekerjaan, tapi pertahankan Tanggal Tugas & Shift
    setForm(prev => ({ 
      ...prev, 
      mesin: "", area: "", sparepart: "", aktivitas: "", start: "", end: "" 
    }));
  };

  // MULTIPLE UPLOAD: Hapus dari Draft
  const handleRemoveDraft = (id: number) => {
    setDraftLogs(draftLogs.filter(log => log.id !== id));
  };

  // MULTIPLE UPLOAD: Kirim Semua Batch
  const handleSubmitBatch = async () => {
    if (!userData || draftLogs.length === 0) return;
    setIsLoading(true);

    const payloadLogs = draftLogs.map(log => ({
      departement: userData.departement,
      nama: userData.nama,
      nik: userData.nik,
      tanggalBuka: tanggalMasuk,
      ...log
    }));

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow", 
        body: JSON.stringify({
          action: "log_activity_batch",
          logs: payloadLogs
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        alert(`Berhasil! ${draftLogs.length} Log aktivitas telah dikirim ke Server.`);
        setDraftLogs([]); // Kosongkan keranjang
      } else {
        alert("Gagal mencatat log: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat mengirim batch log.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSafeImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
    }
    return url;
  };

  if (!userData) return null;

  const availableAreas = validation.areasMap[form.mesin?.toUpperCase()] || [];

  return (
    <div className="max-w-7xl mx-auto relative px-4 sm:px-6 pb-20">
      <div className="absolute top-0 right-0 w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-30 pointer-events-none"></div>

      <div className="mb-8 p-6 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-center sm:text-left relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-[#FFD32A] font-bold text-2xl shadow-inner overflow-hidden border-2 border-white flex-shrink-0">
            {userData.foto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={getSafeImageUrl(userData.foto)} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              userData.nama.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Halo, {userData.nama.split(" ")[0]}! 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">
              {userData.departement} • {userData.plant} (Group {userData.group})
            </p>
          </div>
        </div>
        
        <div className="text-center sm:text-right w-full sm:w-auto">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status Sistem</p>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 sm:px-3 sm:py-1.5 rounded-xl border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-sm sm:text-xs font-bold text-green-700">Siap Input Batch</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 relative z-10">
        
        {/* BAGIAN KIRI: Form Input */}
        <div className="xl:col-span-3 w-full p-6 sm:p-10 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl sm:rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] h-fit">
          <div className="mb-8 border-b border-gray-200/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Form Log Aktivitas</h2>
              <p className="text-sm text-gray-500 mt-1">Catat aktivitas harian Anda ke dalam Database.</p>
            </div>
            <div className="bg-[#FFD32A]/20 text-yellow-800 px-4 py-2 rounded-xl text-xs font-bold border border-[#FFD32A]/30 w-fit">
              Tgl Masuk: {tanggalMasuk}
            </div>
          </div>

          <form onSubmit={handleAddToDraft} className="space-y-8">
            
            <div>
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4">Informasi Shift & Penugasan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Tanggal Tugas</label>
                  <input type="date" name="tanggalTugas" value={form.tanggalTugas} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900" required />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Shift</label>
                  <select name="shift" value={form.shift} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none" required>
                    <option value="" disabled>Pilih Shift...</option>
                    {validation.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-500">Group (Otomatis)</label>
                  <input type="text" value={userData.group} disabled className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200/80 rounded-xl text-gray-500 font-medium cursor-not-allowed" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-500">Plant (Otomatis)</label>
                  <input type="text" value={userData.plant} disabled className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200/80 rounded-xl text-gray-500 font-medium cursor-not-allowed" />
                </div>

              </div>
            </div>

            <hr className="border-gray-200/60" />

            <div>
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4">Area Pekerjaan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Mesin</label>
                  <select name="mesin" value={form.mesin} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none" required>
                    <option value="" disabled>Pilih Mesin...</option>
                    {validation.mesins.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Sub mesin</label>
                  <select name="area" value={form.area} onChange={handleFormChange} disabled={isLoading || !form.mesin} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed" required>
                    <option value="" disabled>{form.mesin ? "Pilih Sub Mesin..." : "Pilih Mesin Terlebih Dahulu"}</option>
                    {availableAreas.map((a: string) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-200/60" />

            <div>
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4">Detail Aktivitas & Waktu</h3>
              <div className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Aktivitas</label>
                  <textarea name="aktivitas" value={form.aktivitas} onChange={handleFormChange} disabled={isLoading} rows={3} placeholder="Jelaskan aktivitas / pekerjaan yang dilakukan..." className="w-full px-5 py-4 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 resize-none" required />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Sparepart </label>
                  <textarea name="sparepart" value={form.sparepart} onChange={handleFormChange} disabled={isLoading} rows={2} placeholder="Sebutkan sparepart yang digunakan/diganti (Jika ada)..." className="w-full px-5 py-3 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 resize-none" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-gray-50/80 rounded-2xl border border-gray-200/60 items-center">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Jam Mulai</label>
                    <input type="time" name="start" value={form.start} onChange={handleFormChange} required className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFD32A] text-gray-900 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Jam Selesai</label>
                    <input type="time" name="end" value={form.end} onChange={handleFormChange} required className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFD32A] text-gray-900 font-bold" />
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-center sm:text-right pt-2 sm:pt-0">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Durasi</p>
                    <p className="text-xl font-extrabold text-black">
                      {calculateDurasi() || "0.00"}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-6 border-t border-gray-200/60 flex justify-end">
              {/* Tombol Simpan ke Draft */}
              <button type="submit" disabled={isLoading} className="group flex items-center justify-center gap-2 py-4 px-10 font-extrabold rounded-2xl text-black bg-white border-2 border-[#FFD32A] hover:bg-[#FFD32A]/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 sm:w-auto w-full shadow-sm">
                Simpan Data ke Draft Pengiriman
              </button>
            </div>
          </form>
        </div>

        {/* BAGIAN KANAN: Keranjang / Draft Logs */}
        <div className="xl:col-span-2 w-full p-6 sm:p-8 bg-gray-900 border border-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl h-[700px] flex flex-col">
          <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#FFD32A]">Draft Pengiriman</h2>
              <p className="text-xs text-gray-400 mt-1">Data Anda belum terkirim ke Server.</p>
            </div>
            <div className="bg-[#FFD32A] text-black w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg">
              {draftLogs.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {draftLogs.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-gray-500 opacity-50 space-y-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-sm font-bold text-center">Draft Kosong.<br/>Isi form dan klik "Tambahkan ke Draft".</p>
              </div>
            ) : (
              draftLogs.map((log, index) => (
                <div key={log.id} className="p-4 bg-gray-800/80 rounded-2xl border border-gray-700 relative group transition-all hover:border-yellow-500/50">
                  <button 
                    onClick={() => handleRemoveDraft(log.id)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-400 bg-gray-900 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="text-[10px] font-black bg-gray-900 text-gray-400 px-2 py-1 rounded">#{index + 1}</span>
                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-900/30 px-2 py-1 rounded border border-yellow-900/50">{log.mesin}</span>
                  </div>
                  <p className="text-sm text-gray-200 font-medium line-clamp-2 leading-relaxed">{log.aktivitas}</p>
                  <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500 font-bold border-t border-gray-700/50 pt-2">
                    <span>{log.start} - {log.end}</span>
                    <span>Durasi: {log.durasi} Jam</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-6 mt-4 border-t border-gray-800">
            <button 
              onClick={handleSubmitBatch} 
              disabled={isLoading || draftLogs.length === 0} 
              className="w-full flex items-center justify-center gap-2 py-4 px-4 font-extrabold rounded-2xl text-black bg-gradient-to-r from-[#FFD32A] to-[#ffda47] hover:shadow-[0_15px_25px_-10px_rgba(255,211,42,0.3)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:grayscale"
            >
              {isLoading ? "Mengirim ke Server..." : `Kirim Semua Log`}
              {!isLoading && draftLogs.length > 0 && (
                <svg className="h-5 w-5 animate-bounce ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}} />
    </div>
  );
}