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

export default function LogAktivitasPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  
  // State Validation Data ditambah "groups"
  const [validation, setValidation] = useState({
    groups: [] as string[],
    plants: [] as string[],
    shifts: [] as string[],
    mesins: [] as string[],
    areasMap: {} as Record<string, string[]> 
  });

  // State Form (Ditambah field 'group')
  const [form, setForm] = useState({
    group: "", // Ditambahkan di state form agar bisa diubah
    plant: "",
    shift: "",
    tanggalTugas: "",
    mesin: "",
    area: "",
    sparepart: "",
    aktivitas: "",
    start: "",
    end: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  // PASTIKAN URL SCRIPT ANDA BENAR
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";

  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (!storedData) {
      router.push("/login");
      return;
    }
    const parsedData = JSON.parse(storedData);
    setUserData(parsedData);
    
    // Inisialisasi form.group dengan group asli user agar ada nilai default
    setForm(prev => ({ ...prev, group: parsedData.group }));

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

  // REVISI 3: Hitung Durasi dengan format 0.00
  const calculateDurasi = () => {
    if (!form.start || !form.end) return "";
    const [startH, startM] = form.start.split(':').map(Number);
    const [endH, endM] = form.end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return "";

    let startTotal = (startH * 60) + startM;
    let endTotal = (endH * 60) + endM;
    
    // Logika Shift Lintas Hari (Malam ke Pagi)
    if (endTotal < startTotal) endTotal += 24 * 60; 
    
    const diff = endTotal - startTotal;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    
    // Format 0.00 (Contoh: 1.30 untuk 1 Jam 30 Menit)
    return `${h}.${m.toString().padStart(2, '0')}`;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      if (name === "mesin") newForm.area = ""; // Reset area jika mesin diganti
      return newForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setIsLoading(true);

    const durasi = calculateDurasi();

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow", 
        body: JSON.stringify({
          action: "log_activity",
          departement: userData.departement, // Tidak bisa diubah (Kolom C)
          nama: userData.nama,               // Tidak bisa diubah (Kolom D)
          tanggalBuka: tanggalMasuk,         
          
          group: form.group,                 // SEKARANG MENGGUNAKAN DARI FORM
          plant: form.plant,                 
          shift: form.shift,                 
          tanggalTugas: form.tanggalTugas,   
          mesin: form.mesin,                 
          area: form.area,                   
          sparepart: form.sparepart,         
          aktivitas: form.aktivitas,         
          start: form.start,                 
          end: form.end,                     
          durasi: durasi                     
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("Log aktivitas berhasil dikirim ke Database.");
        // Kosongkan log tapi sisakan Group, Plant, dan Shift agar user enak lanjut input
        setForm(prev => ({ ...prev, mesin: "", area: "", sparepart: "", aktivitas: "", start: "", end: "" }));
      } else {
        alert("Gagal mencatat log: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menghubungi server.");
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
    <div className="max-w-6xl mx-auto relative px-4 sm:px-6 pb-10">
      <div className="absolute top-0 right-0 w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-30 pointer-events-none"></div>

      <div className="mb-8 p-6 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-center sm:text-left">
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
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">NIK Karyawan</p>
          <p className="text-base sm:text-lg font-bold text-gray-900 bg-gray-50 px-4 py-2 sm:px-3 sm:py-1 rounded-xl sm:rounded-lg border border-gray-200 inline-block">
            {userData.nik}
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full p-6 sm:p-10 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl sm:rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)]">
        <div className="mb-8 border-b border-gray-200/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Form Log Aktivitas</h2>
            <p className="text-sm text-gray-500 mt-1">Catat aktivitas harian Anda ke dalam Data Lake.</p>
          </div>
          <div className="bg-[#FFD32A]/20 text-yellow-800 px-4 py-2 rounded-xl text-xs font-bold border border-[#FFD32A]/30 w-fit">
            Tgl Masuk: {tanggalMasuk}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div>
            <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4">Informasi Shift & Penugasan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Tanggal Tugas</label>
                <input type="date" name="tanggalTugas" value={form.tanggalTugas} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900" required />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Plant</label>
                <select name="plant" value={form.plant} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none" required>
                  <option value="" disabled>Pilih Plant...</option>
                  {validation.plants.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* REVISI 1: Group Sekarang Masuk Dropdown Editable */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Group</label>
                <select name="group" value={form.group} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none" required>
                  <option value="" disabled>Pilih Group...</option>
                  {validation.groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Shift</label>
                <select name="shift" value={form.shift} onChange={handleFormChange} disabled={isLoading} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none" required>
                  <option value="" disabled>Pilih Shift...</option>
                  {validation.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* ReadOnly Identitas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
              <div className="space-y-1.5"><label className="block text-sm font-bold text-gray-500">Nama (Otomatis)</label><input type="text" value={userData.nama} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium" /></div>
              <div className="space-y-1.5"><label className="block text-sm font-bold text-gray-500">Departement (Otomatis)</label><input type="text" value={userData.departement} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium" /></div>
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
                <label className="block text-sm font-bold text-gray-700">Area</label>
                <select name="area" value={form.area} onChange={handleFormChange} disabled={isLoading || !form.mesin} className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 text-gray-900 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed" required>
                  <option value="" disabled>{form.mesin ? "Pilih Area..." : "Pilih Mesin Terlebih Dahulu"}</option>
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
                <label className="block text-sm font-bold text-gray-700">Penggantian Sparepart <span className="text-gray-400 font-normal">(Opsional)</span></label>
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
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Durasi Total</p>
                  <p className="text-xl font-extrabold text-black">
                    {calculateDurasi() || "0.00"}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-gray-200/60 flex justify-end">
            <button type="submit" disabled={isLoading} className="group flex items-center justify-center gap-2 py-4 px-10 font-extrabold rounded-2xl text-black bg-gradient-to-r from-[#FFD32A] to-[#ffda47] hover:shadow-[0_15px_25px_-10px_rgba(255,211,42,1)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 sm:w-auto w-full">
              {isLoading ? "Menyimpan Data..." : "Kirim Log Aktivitas"}
              {!isLoading && (
                <svg className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}