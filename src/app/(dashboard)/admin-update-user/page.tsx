"use client";

import { useEffect, useState } from "react";

export default function AdminUpdateUserPage() {
  // PENTING: PASTIKAN URL INI BENAR
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState<any>(null); 
  const [isSaving, setIsSaving] = useState(false);
  const [validationData, setValidationData] = useState({ group: [], departement: [], plant: [] });

  // STATE BARU: Mode Tambah User
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ nama: "", nik: "", password: "", group: "", departement: "", plant: "" });

  const loadUsers = () => {
    fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "get_manage_users" }) })
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") setUsers(res.data);
      });
  };

  useEffect(() => {
    loadUsers();
    fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "get_validation" }) })
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") setValidationData(res.data);
      });
  }, []);

  const handleSelectUser = (u: any) => {
    setIsAddingMode(false); // Matikan mode tambah
    setSelectedUser(u);
  };

  const handleModeTambah = () => {
    setSelectedUser(null); // Kosongkan pilihan user
    setIsAddingMode(true); // Nyalakan mode tambah
    setNewUserForm({ nama: "", nik: "", password: "", group: "", departement: "", plant: "" });
  };

  // --- FUNGSI UPDATE DATA (Eksisting) ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ 
          action: "admin_update_user", 
          rowIndex: selectedUser.rowIndex,
          nama: selectedUser.nama,
          nik: selectedUser.nik,
          group: selectedUser.group,
          departement: selectedUser.dept,
          plant: selectedUser.plant
        })
      });
      const result = await res.json();
      alert(result.message);
      loadUsers(); 
    } catch (error) {
      alert("Terjadi kesalahan saat mengupdate.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FUNGSI HAPUS DATA (Eksisting) ---
  const handleDelete = async () => {
    if (!selectedUser) return;
    if (!confirm(`PERINGATAN!\n\nApakah Anda yakin ingin MENGHAPUS secara permanen user: ${selectedUser.nama}?`)) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "admin_delete_user", rowIndex: selectedUser.rowIndex })
      });
      const result = await res.json();
      alert(result.message);
      setSelectedUser(null);
      loadUsers(); 
    } catch (error) {
      alert("Gagal menghapus user.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FUNGSI TAMBAH DATA (BARU) ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "admin_add_user", ...newUserForm })
      });
      const result = await res.json();
      alert(result.message);
      
      setIsAddingMode(false); // Tutup form tambah
      loadUsers(); // Refresh data list agar user baru muncul
    } catch (error) {
      alert("Gagal menambahkan personil baru.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Manajemen Data Karyawan 🛠️</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* KOLOM KIRI: List User */}
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-lg h-[650px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pilih Karyawan ({users.length})</h2>
          </div>

          {/* TOMBOL TAMBAH USER BARU */}
          <button 
            onClick={handleModeTambah}
            className={`w-full py-4 mb-4 rounded-2xl border-2 border-dashed font-bold flex justify-center items-center gap-2 transition-all ${isAddingMode ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Tambah Personil Baru
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {users.map((u: any) => (
              <div 
                key={u.rowIndex} 
                onClick={() => handleSelectUser(u)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedUser?.rowIndex === u.rowIndex && !isAddingMode ? 'bg-[#FFD32A] border-[#FFD32A] shadow-md' : 'bg-white border-gray-100 hover:border-yellow-400'}`}
              >
                <p className="font-bold text-sm text-gray-900">{u.nama}</p>
                <p className="text-[10px] text-gray-500 mt-1">NIK: <span className="font-mono">{u.nik}</span> • GRP {u.group} • {u.dept}</p>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Memuat data user...</p>}
          </div>
        </div>

        {/* KOLOM KANAN: Form Edit ATAU Form Tambah */}
        <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl text-white h-fit">
          
          {/* STATE 1: JIKA BELUM MILIH APA-APA */}
          {!selectedUser && !isAddingMode && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <p className="italic text-sm text-center">Pilih karyawan di sebelah kiri untuk mengedit,<br/>atau klik "Tambah Personil Baru".</p>
            </div>
          )}

          {/* STATE 2: JIKA MODE TAMBAH USER BARU */}
          {isAddingMode && (
            <form onSubmit={handleAddUser} className="space-y-4 animate-in fade-in zoom-in duration-300">
              <h2 className="text-xl font-black text-green-400 mb-6 border-b border-gray-700 pb-4">✨ Pendaftaran Karyawan Baru</h2>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Lengkap</label>
                <input type="text" value={newUserForm.nama} onChange={e => setNewUserForm({...newUserForm, nama: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 text-white" placeholder="Contoh: John Doe" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nomor Induk (NIK)</label>
                <input type="text" value={newUserForm.nik} onChange={e => setNewUserForm({...newUserForm, nik: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 text-white font-mono" placeholder="Masukkan NIK" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Password Awal</label>
                <input type="text" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} required className="w-full bg-gray-800 border border-green-500/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 text-white" placeholder="Buat password login..." />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Group</label>
                <select value={newUserForm.group} onChange={e => setNewUserForm({...newUserForm, group: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 appearance-none cursor-pointer text-white">
                  <option value="" disabled>Pilih Group</option>
                  {validationData.group.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Departement</label>
                <select value={newUserForm.departement} onChange={e => setNewUserForm({...newUserForm, departement: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 appearance-none cursor-pointer text-white">
                  <option value="" disabled>Pilih Departement</option>
                  {validationData.departement.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plant</label>
                <select value={newUserForm.plant} onChange={e => setNewUserForm({...newUserForm, plant: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400 appearance-none cursor-pointer text-white">
                  <option value="" disabled>Pilih Plant</option>
                  {validationData.plant.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-4 bg-green-500 text-white font-black rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 mt-4">
                {isSaving ? "Mendaftarkan..." : "Daftarkan Personil Baru"}
              </button>
            </form>
          )}

          {/* STATE 3: JIKA MODE EDIT (Seperti Biasa) */}
          {selectedUser && !isAddingMode && (
            <form onSubmit={handleUpdate} className="space-y-4 animate-in fade-in zoom-in duration-300">
              <h2 className="text-xl font-black text-[#FFD32A] mb-6 border-b border-gray-700 pb-4">✏️ Edit Informasi</h2>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Lengkap</label>
                <input type="text" value={selectedUser.nama} onChange={e => setSelectedUser({...selectedUser, nama: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFD32A] text-white" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nomor Induk (NIK)</label>
                <input type="text" value={selectedUser.nik} onChange={e => setSelectedUser({...selectedUser, nik: e.target.value})} required className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFD32A] text-white font-mono" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Group</label>
                <select value={selectedUser.group} onChange={e => setSelectedUser({...selectedUser, group: e.target.value})} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFD32A] appearance-none cursor-pointer text-white">
                  <option value="" disabled>Pilih Group</option>
                  {validationData.group.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Departement</label>
                <select value={selectedUser.dept} onChange={e => setSelectedUser({...selectedUser, dept: e.target.value})} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFD32A] appearance-none cursor-pointer text-white">
                  <option value="" disabled>Pilih Departement</option>
                  {validationData.departement.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plant</label>
                <select value={selectedUser.plant} onChange={e => setSelectedUser({...selectedUser, plant: e.target.value})} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#FFD32A] appearance-none cursor-pointer text-white">
                  <option value="" disabled>Pilih Plant</option>
                  {validationData.plant.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 py-3.5 bg-[#FFD32A] text-black font-black rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 text-sm">
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button type="button" onClick={handleDelete} disabled={isSaving} className="px-6 py-3.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black rounded-xl transition-colors disabled:opacity-50 text-sm">
                  Hapus
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* CSS Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}} />
    </div>
  );
}