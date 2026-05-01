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

interface UsedPart {
  jenisSparepart: string;
  sparepart: string;
  qtySparepart: string;
}

interface DraftLog {
  id: number;
  tanggalTugas: string;
  plant: string;
  group: string;
  shift: string;
  mesin: string;
  area: string;
  usedParts: UsedPart[]; 
  aktivitas: string;
  start: string;
  end: string;
  durasi: string;
}

type SparepartGrouped = Record<string, { spesifikasi: string, stok: number }[]>;

export default function LogAktivitasPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  
  const [validation, setValidation] = useState({
    groups: [] as string[],
    plants: [] as string[],
    shifts: [] as string[],
    mesins: [] as string[],
    areasMap: {} as Record<string, string[]> 
  });

  const [sparepartsGudang, setSparepartsGudang] = useState<SparepartGrouped>({});

  const [form, setForm] = useState({
    shift: "", tanggalTugas: "",
    mesin: "", area: "", aktivitas: "", start: "", end: ""
  });

  // State terpisah khusus untuk input keranjang part sementara
  const [tempPart, setTempPart] = useState({
    jenisSparepart: "", sparepart: "", qtySparepart: ""
  });

  const [usedPartsArray, setUsedPartsArray] = useState<UsedPart[]>([]);

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
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_log_validation" })
    })
    .then(res => res.json())
    .then(res => { if (res.status === "success") setValidation(res.data); })
    .catch(err => console.error("Gagal memuat data dropdown:", err));

    if (parsedData && parsedData.plant) {
        fetch(SCRIPT_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_sparepart_gudang", plant: parsedData.plant })
        })
        .then(res => res.json())
        .then(res => { 
            if (res.status === "success") setSparepartsGudang(res.data); 
        })
        .catch(err => console.error("Gagal memuat data Gudang:", err));
    }

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

  const handleTempPartChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTempPart(prev => {
      const newTemp = { ...prev, [name]: value };
      if (name === "jenisSparepart") {
          newTemp.sparepart = "";
          newTemp.qtySparepart = "";
      }
      return newTemp;
    });
  };

  const addPartToList = () => {
    if (!tempPart.jenisSparepart || !tempPart.sparepart || !tempPart.qtySparepart) {
        alert("Harap lengkapi Jenis, Spesifikasi, dan Jumlah Part!");
        return;
    }
    
    const qty = parseInt(tempPart.qtySparepart);
    if (isNaN(qty) || qty <= 0) {
        alert("Jumlah harus lebih dari 0!");
        return;
    }

    const selectedPartObj = sparepartsGudang[tempPart.jenisSparepart]?.find(p => p.spesifikasi === tempPart.sparepart);
    const maxQty = selectedPartObj ? selectedPartObj.stok : 0;
    
    if (qty > maxQty) {
        alert(`Gagal: Jumlah melebihi stok yang tersedia (${maxQty} Pcs)!`);
        return;
    }

    const isExist = usedPartsArray.find(p => p.sparepart === tempPart.sparepart);
    if (isExist) {
        alert("Part ini sudah ada di dalam daftar! Hapus terlebih dahulu jika ingin mengubah jumlahnya.");
        return;
    }

    setUsedPartsArray([...usedPartsArray, { ...tempPart }]);
    setTempPart({ jenisSparepart: "", sparepart: "", qtySparepart: "" });
  };

  const removePartFromList = (spek: string) => {
    setUsedPartsArray(usedPartsArray.filter(p => p.sparepart !== spek));
  };

  const handleAddToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    const durasi = calculateDurasi();
    const newLog: DraftLog = {
      id: Date.now(),
      tanggalTugas: form.tanggalTugas,
      shift: form.shift,
      plant: userData.plant, 
      group: userData.group, 
      mesin: form.mesin,
      area: form.area,
      usedParts: [...usedPartsArray], // Memasukkan semua part yang ada di keranjang
      aktivitas: form.aktivitas,
      start: form.start,
      end: form.end,
      durasi: durasi || "0.00"
    };

    setDraftLogs([...draftLogs, newLog]);
    
    // Reset Form & Keranjang Part
    setForm(prev => ({ 
      ...prev, mesin: "", area: "", aktivitas: "", start: "", end: "" 
    }));
    setUsedPartsArray([]);
    setTempPart({ jenisSparepart: "", sparepart: "", qtySparepart: "" });
  };

  const handleRemoveDraft = (id: number) => {
    setDraftLogs(draftLogs.filter(log => log.id !== id));
  };

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
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", 
        body: JSON.stringify({ action: "log_activity_batch", logs: payloadLogs }),
      });

      const result = await response.json();
      if (result.status === "success") {
        alert(result.message); 
        setDraftLogs([]); 
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
  
  const selectedPartObj = tempPart.jenisSparepart && tempPart.sparepart 
    ? sparepartsGudang[tempPart.jenisSparepart]?.find(p => p.spesifikasi === tempPart.sparepart) 
    : null;
  const maxQty = selectedPartObj ? selectedPartObj.stok : "";

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
            <p className="text-sm sm:text-xs font-bold text-green-700">Terkoneksi Data Gudang</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 relative z-10">
        
        <div className="xl:col-span-3 w-full p-6 sm:p-10 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl sm:rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] h-fit">
          <div className="mb-8 border-b border-gray-200/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Form Log Aktivitas</h2>
              <p className="text-sm text-gray-500 mt-1">Catat aktivitas harian dan pemakaian sparepart Anda.</p>
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
                  <label className="block text-sm font-bold text-gray-500">Group</label>
                  <input type="text" value={userData.group} disabled className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200/80 rounded-xl text-gray-500 font-medium cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-500">Plant</label>
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
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4">Detail Aktivitas & Pemakaian Part</h3>
              <div className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Deskripsi Aktivitas</label>
                  <textarea name="aktivitas" value={form.aktivitas} onChange={handleFormChange} disabled={isLoading} rows={2} placeholder="Jelaskan perbaikan / aktivitas yang dilakukan..." className="w-full px-5 py-4 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 resize-none" required />
                </div>

                {/* MODIFIKASI MULTIPLE PART: UI Mini Cart */}
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/60 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-900">Tambahkan Sparepart (Jika Ada)</span>
                    <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-700 font-bold uppercase tracking-wider">Live Gudang</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="col-span-1 sm:col-span-4">
                      <select name="jenisSparepart" value={tempPart.jenisSparepart} onChange={handleTempPartChange} disabled={isLoading || Object.keys(sparepartsGudang).length === 0} className="w-full px-3 py-2.5 bg-white border border-blue-300/80 rounded-lg text-sm text-gray-900 appearance-none disabled:bg-gray-100">
                        <option value="">-- Pilih Jenis --</option>
                        {Object.keys(sparepartsGudang).map(jenis => (
                          <option key={jenis} value={jenis}>{jenis}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 sm:col-span-5">
                      <select name="sparepart" value={tempPart.sparepart} onChange={handleTempPartChange} disabled={isLoading || !tempPart.jenisSparepart} className="w-full px-3 py-2.5 bg-white border border-blue-300/80 rounded-lg text-sm text-gray-900 appearance-none disabled:bg-gray-100">
                        <option value="">-- Pilih Spesifikasi --</option>
                        {tempPart.jenisSparepart && sparepartsGudang[tempPart.jenisSparepart]?.map((part, idx) => (
                          <option key={idx} value={part.spesifikasi} disabled={part.stok <= 0}>
                            {part.spesifikasi} {part.stok > 0 ? `(Stok: ${part.stok})` : `(KOSONG)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <input type="number" name="qtySparepart" min="1" max={maxQty} value={tempPart.qtySparepart} onChange={handleTempPartChange} disabled={isLoading || !tempPart.sparepart} placeholder="Jml" className="w-full px-3 py-2.5 bg-white border border-blue-300/80 rounded-lg text-sm text-center text-blue-700 font-bold disabled:bg-gray-100" />
                    </div>
                    <div className="col-span-1 sm:col-span-1">
                      <button type="button" onClick={addPartToList} disabled={isLoading || !tempPart.sparepart || !tempPart.qtySparepart} className="w-full h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex justify-center items-center font-bold disabled:opacity-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Daftar Part yang sudah ditambahkan */}
                  {usedPartsArray.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200/50">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Part yang akan digunakan:</p>
                      <div className="flex flex-wrap gap-2">
                        {usedPartsArray.map((p, idx) => (
                          <div key={idx} className="inline-flex items-center gap-2 bg-white border border-blue-300/80 pl-3 pr-1 py-1 rounded-full shadow-sm text-xs font-bold text-slate-700">
                            <span>{p.sparepart} <span className="text-blue-600">({p.qtySparepart} Pcs)</span></span>
                            <button type="button" onClick={() => removePartFromList(p.sparepart)} className="w-5 h-5 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex justify-center items-center transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              <button type="submit" disabled={isLoading} className="group flex items-center justify-center gap-2 py-4 px-10 font-extrabold rounded-2xl text-black bg-white border-2 border-[#FFD32A] hover:bg-[#FFD32A]/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 sm:w-auto w-full shadow-sm">
                Simpan Data ke Draft Pengiriman
              </button>
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 w-full p-6 sm:p-8 bg-gray-900 border border-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl h-[700px] flex flex-col">
          <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#FFD32A]">Draft Pengiriman</h2>
              <p className="text-xs text-gray-400 mt-1">Data belum dikirim ke Database Satoria.</p>
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
                  <p className="text-sm text-gray-200 font-medium line-clamp-2 leading-relaxed mb-3">{log.aktivitas}</p>
                  
                  {/* Render Array Part di Draft */}
                  {log.usedParts && log.usedParts.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {log.usedParts.map((p, pIdx) => (
                         <span key={pIdx} className="inline-flex items-center gap-1 bg-blue-900/40 border border-blue-500/30 px-2 py-1 rounded text-blue-300 text-[10px] font-bold">
                           ⚙️ {p.sparepart} (-{p.qtySparepart})
                         </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1 flex justify-between items-center text-[10px] text-gray-500 font-bold border-t border-gray-700/50 pt-2">
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
              {isLoading ? "Mengirim Data & Memotong Stok..." : `Kirim Semua Log`}
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