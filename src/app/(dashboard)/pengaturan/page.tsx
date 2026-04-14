"use client";

import { useEffect, useState, useRef } from "react";

interface UserData {
  nama: string;
  nik: string;
  group: string;
  departement: string;
  plant: string;
  foto?: string;
}

export default function PengaturanPage() {
  // PENTING: PASTIKAN URL INI BENAR
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec"; 

  const [userData, setUserData] = useState<UserData | null>(null);
  
  // State Form & Loading
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [validationData, setValidationData] = useState({ group: [], departement: [], plant: [] });
  const [formProfil, setFormProfil] = useState({ group: "", departement: "", plant: "" });

  // State Ganti Password
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  
  // State untuk Show/Hide Password
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setUserData(parsed);
      setFormProfil({ group: parsed.group, departement: parsed.departement, plant: parsed.plant });
    }

    fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "get_validation" })
    })
    .then(res => res.json())
    .then(res => {
      if(res.status === "success") setValidationData(res.data);
    })
    .catch(err => console.error("Gagal memuat dropdown:", err));
  }, []);

  // Fix Gambar Google Drive
  const getSafeImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
    }
    return url;
  };

  const triggerGlobalUpdate = () => {
    window.dispatchEvent(new CustomEvent("userUpdated"));
    window.dispatchEvent(new Event("storage"));
  };

  // Kompresi Gambar dengan Canvas
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    if (file.size > 10 * 1024 * 1024) { 
      alert("Maksimal ukuran foto awal adalah 10MB!"); 
      return; 
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64Compressed = dataUrl.split(',')[1];

        try {
          const res = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({
              action: "upload_photo", 
              nik: userData.nik, 
              nama: userData.nama,
              base64: base64Compressed,
              mimeType: "image/jpeg",
              fileName: `Foto_${userData.nik}_${Date.now()}.jpg`
            })
          });
          const result = await res.json();
          if (result.status === "success") {
            const newData = { ...userData, foto: result.url };
            setUserData(newData);
            localStorage.setItem("userData", JSON.stringify(newData));
            triggerGlobalUpdate();
            alert("Foto profil berhasil diperbarui!");
          } else alert("Gagal upload: " + result.message);
        } catch (error) { 
          alert("Kesalahan jaringan."); 
        } finally { 
          setIsUploading(false); 
        }
      };
    };
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setIsUpdatingProfile(true);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "update_profile", nik: userData.nik, ...formProfil })
      });
      const result = await res.json();
      if (result.status === "success") {
        const newData = { ...userData, ...formProfil };
        setUserData(newData);
        localStorage.setItem("userData", JSON.stringify(newData));
        triggerGlobalUpdate();
        alert("Informasi Pekerjaan berhasil diperbarui!");
      } else alert(result.message);
    } catch (error) { alert("Kesalahan sistem."); } finally { setIsUpdatingProfile(false); }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    if (passwords.new !== passwords.confirm) {
      alert("Konfirmasi Password Baru tidak cocok!");
      return;
    }
    if (passwords.new.length < 8) {
      alert("Password baru minimal 8 karakter!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "update_password",
          nik: userData.nik,
          oldPassword: passwords.old,
          newPassword: passwords.new
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        alert("Password berhasil diubah! Harap ingat password baru Anda.");
        setPasswords({ old: "", new: "", confirm: "" });
        // Reset toggle visibility setelah berhasil
        setShowOldPass(false); setShowNewPass(false); setShowConfirmPass(false);
      } else {
        alert(result.message);
      }
    } catch (error) { alert("Kesalahan sistem saat mengganti password."); } 
    finally { setIsSaving(false); }
  };

  // Ikon Eye Component (Agar rapi)
  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  if (!userData) return null;

  return (
    <div className="max-w-6xl mx-auto relative px-4 sm:px-6 lg:px-8 pb-10">
      <div className="absolute top-[10%] left-[-5%] w-[20rem] md:w-[30rem] h-[20rem] md:h-[30rem] bg-[#FFD32A] rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-20 pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="relative z-10 w-full p-6 md:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl md:rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] text-center">
            
            <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32 mb-6 group">
              <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`w-full h-full rounded-full flex items-center justify-center text-4xl md:text-5xl font-extrabold shadow-xl ring-4 md:ring-8 ring-white/50 cursor-pointer overflow-hidden relative bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-600 text-[#FFD32A] ${isUploading ? 'opacity-50 animate-pulse' : 'hover:opacity-90 transition-opacity'}`}>
                {userData.foto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={getSafeImageUrl(userData.foto)} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : ( userData.nama.charAt(0).toUpperCase() )}
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg></div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            </div>

            {isUploading && (
              <div className="mb-4">
                <span className="text-xs font-bold text-yellow-600 animate-bounce inline-block">
                  Mengompres & Mengupload...
                </span>
              </div>
            )}

            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">{userData.nama}</h2>
            <p className="text-xs md:text-sm font-bold text-[#FFD32A] mt-1 uppercase tracking-widest">{userData.departement}</p>
            
            <div className="mt-8 text-left space-y-3 md:space-y-4">
              <div className="p-3 md:p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Nomor Induk Karyawan</p>
                <p className="text-base md:text-lg font-bold text-gray-900">{userData.nik}</p>
              </div>
              <div className="flex gap-3 md:gap-4">
                <div className="flex-1 p-3 md:p-4 bg-gray-50/80 rounded-2xl border border-gray-100"><p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Plant</p><p className="text-sm md:text-md font-bold text-gray-900">{userData.plant}</p></div>
                <div className="flex-1 p-3 md:p-4 bg-gray-50/80 rounded-2xl border border-gray-100"><p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Group</p><p className="text-sm md:text-md font-bold text-gray-900">{userData.group}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Card Form Profil Pekerjaan */}
          <div className="relative z-10 w-full p-6 md:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl md:rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Informasi Pekerjaan</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-1.5 group"><label className="block text-sm font-bold text-gray-700">Departement</label><select value={formProfil.departement} onChange={e => setFormProfil({...formProfil, departement: e.target.value})} className="w-full px-4 py-3 md:px-5 md:py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] font-medium text-sm md:text-base appearance-none" required><option value="" disabled>Pilih Departement</option>{validationData.departement.map((val: string) => <option key={val} value={val}>{val}</option>)}</select></div>
                <div className="space-y-1.5 group"><label className="block text-sm font-bold text-gray-700">Plant</label><select value={formProfil.plant} onChange={e => setFormProfil({...formProfil, plant: e.target.value})} className="w-full px-4 py-3 md:px-5 md:py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] font-medium text-sm md:text-base appearance-none" required><option value="" disabled>Pilih Plant</option>{validationData.plant.map((val: string) => <option key={val} value={val}>{val}</option>)}</select></div>
                <div className="space-y-1.5 group sm:col-span-2"><label className="block text-sm font-bold text-gray-700">Group</label><select value={formProfil.group} onChange={e => setFormProfil({...formProfil, group: e.target.value})} className="w-full px-4 py-3 md:px-5 md:py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] font-medium text-sm md:text-base appearance-none" required><option value="" disabled>Pilih Group</option>{validationData.group.map((val: string) => <option key={val} value={val}>{val}</option>)}</select></div>
              </div>
              <div className="pt-2 md:pt-4 flex justify-end"><button type="submit" disabled={isUpdatingProfile} className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 font-extrabold rounded-xl text-black bg-gradient-to-r from-[#FFD32A] to-[#ffda47] hover:shadow-[0_10px_20px_-10px_rgba(255,211,42,1)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 text-sm md:text-base">{isUpdatingProfile ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
            </form>
          </div>

          {/* Card Keamanan Akun DENGAN SHOW/HIDE PASSWORD */}
          <div className="relative z-10 w-full p-6 md:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl md:rounded-[2rem] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Keamanan Akun</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Perbarui kata sandi Anda secara berkala.</p>
            <form onSubmit={handleSavePassword} className="space-y-4 md:space-y-5">
              
              <div className="space-y-1.5 group">
                <label className="block text-sm font-bold text-gray-700">Password Lama</label>
                <div className="relative flex items-center">
                  <input 
                    type={showOldPass ? "text" : "password"} 
                    value={passwords.old} 
                    onChange={e => setPasswords({...passwords, old: e.target.value})} 
                    className="w-full pl-4 pr-12 py-3 md:pl-5 md:py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] text-sm md:text-base" 
                    placeholder="••••••••" 
                    required 
                  />
                  <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-4 text-gray-400 hover:text-gray-700 transition-colors">
                    {showOldPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-1.5 group">
                  <label className="block text-sm font-bold text-gray-700">Password Baru</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showNewPass ? "text" : "password"} 
                      value={passwords.new} 
                      onChange={e => setPasswords({...passwords, new: e.target.value})} 
                      className="w-full pl-4 pr-12 py-3 md:pl-5 md:py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] text-sm md:text-base" 
                      placeholder="Minimal 8 karakter" 
                      required 
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 text-gray-400 hover:text-gray-700 transition-colors">
                      {showNewPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5 group">
                  <label className="block text-sm font-bold text-gray-700">Konfirmasi Password</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showConfirmPass ? "text" : "password"} 
                      value={passwords.confirm} 
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                      className="w-full pl-4 pr-12 py-3 md:pl-5 md:py-3.5 bg-white border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] text-sm md:text-base" 
                      placeholder="Ulangi Konfirmasi Password" 
                      required 
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 text-gray-400 hover:text-gray-700 transition-colors">
                      {showConfirmPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 md:pt-4 flex justify-end">
                <button type="submit" disabled={isSaving} className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 font-extrabold rounded-xl text-black bg-gradient-to-r from-[#FFD32A] to-[#ffda47] hover:shadow-[0_10px_20px_-10px_rgba(255,211,42,1)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 text-sm md:text-base">
                  {isSaving ? "Menyimpan..." : "Perbarui Password"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}