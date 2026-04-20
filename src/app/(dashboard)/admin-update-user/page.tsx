"use client";

import { useEffect, useState } from "react";

export default function AdminUpdateUserPage() {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState<any>(null); // Pakai object user utuh
  const [isSaving, setIsSaving] = useState(false);
  const [validationData, setValidationData] = useState({ group: [], departement: [], plant: [] });

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ 
          action: "admin_update_user", 
          rowIndex: selectedUser.rowIndex, // Kunci utama sekarang adalah Row Index!
          nama: selectedUser.nama,
          nik: selectedUser.nik,
          group: selectedUser.group,
          departement: selectedUser.dept,
          plant: selectedUser.plant
        })
      });
      const result = await res.json();
      alert(result.message);
      loadUsers(); // Refresh list
    } catch (error) {
      alert("Terjadi kesalahan saat mengupdate.");
    } finally {
      setIsSaving(false);
    }
  };

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
      loadUsers(); // Refresh list
    } catch (error) {
      alert("Gagal menghapus user.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Manajemen Data Karyawan 🛠️</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* List User */}
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-lg h-[600px] overflow-y-auto custom-scrollbar">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Pilih Karyawan ({users.length})</h2>
          <div className="space-y-2">
            {users.map((u: any) => (
              <div 
                key={u.rowIndex} 
                onClick={() => setSelectedUser(u)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedUser?.rowIndex === u.rowIndex ? 'bg-[#FFD32A] border-[#FFD32A] shadow-md' : 'bg-white border-gray-100 hover:border-yellow-400'}`}
              >
                <p className="font-bold text-sm text-gray-900">{u.nama}</p>
                <p className="text-[10px] text-gray-500 mt-1">NIK: <span className="font-mono">{u.nik}</span> • GRP {u.group} • {u.dept}</p>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Memuat data user...</p>}
          </div>
        </div>

        {/* Form Edit */}
        <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl text-white h-fit">
          <h2 className="text-xl font-black text-[#FFD32A] mb-6">Edit Informasi</h2>
          {!selectedUser ? (
            <p className="text-gray-500 italic text-sm text-center py-10">Pilih karyawan di sebelah kiri untuk mulai mengedit.</p>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              
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