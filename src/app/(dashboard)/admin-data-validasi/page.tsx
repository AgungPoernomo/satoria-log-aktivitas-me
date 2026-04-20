"use client";
import { useEffect, useState } from "react";

export default function DataValidasiPage() {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";
  const [data, setData] = useState<any>({});
  const [headers, setHeaders] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [activeCol, setActiveCol] = useState("GROUP");
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "get_data_validasi" }) })
      .then(res => res.json()).then(res => {
        setData(res.data);
        setHeaders(res.headers);
      });
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (val: string, type: "add" | "delete") => {
    if (type === "delete" && !confirm(`Yakin ingin menghapus '${val}' dari ${activeCol}?`)) return;
    
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "update_val_item", column: activeCol, value: val, type })
      });
      setNewItem("");
      loadData(); // Refresh UI setelah proses di Sheet selesai
    } catch (e) {
      alert("Kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Pusat Data Validasi ⚙️</h1>
        <p className="text-sm text-gray-500 mt-2">Mengelola parameter Dropdown untuk seluruh sistem.</p>
      </div>
      
      {/* Scrollable Tabs Headers */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar sticky top-0 bg-[#FAFAFA] z-10 py-2">
        {headers.map(h => (
          <button 
            key={h} onClick={() => setActiveCol(h)} 
            className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-xs transition-all ${activeCol === h ? 'bg-gray-900 text-[#FFD32A] shadow-md scale-105' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
          >
            {h}
          </button>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white">
        
        {/* Notifikasi Cerdas jika memilih MESIN */}
        {activeCol === "MESIN" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex gap-3 items-start">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-bold text-yellow-800">Kolom Otomatis</p>
              <p className="text-xs text-yellow-700 mt-1">Saat Anda menambahkan <strong>MESIN</strong> baru, sistem akan otomatis membuatkan <strong>SUB MESIN</strong> baru di Database. Begitu juga saat dihapus.</p>
            </div>
          </div>
        )}

        {/* Input Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input 
            type="text" 
            value={newItem} 
            onChange={e=>setNewItem(e.target.value)} 
            className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 font-medium" 
            placeholder={`Tambah data baru ke list ${activeCol}...`} 
            onKeyDown={e => e.key === 'Enter' && newItem && handleAction(newItem, "add")}
          />
          <button 
            onClick={() => handleAction(newItem, "add")} 
            disabled={loading || !newItem} 
            className="px-10 py-4 bg-gray-900 text-[#FFD32A] font-black rounded-2xl hover:-translate-y-1 transition-transform disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Tambah Data"}
          </button>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data[activeCol]?.map((item: string, i: number) => (
            <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 shadow-sm rounded-xl hover:border-yellow-400 group transition-colors">
              <span className="font-bold text-gray-700 text-sm truncate pr-4">{item}</span>
              <button 
                onClick={() => handleAction(item, "delete")} 
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                title="Hapus"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
          {(!data[activeCol] || data[activeCol].length === 0) && (
            <div className="col-span-full text-center py-10 text-gray-400 text-sm font-medium">Belum ada data di kolom {activeCol} ini.</div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}} />
    </div>
  );
}