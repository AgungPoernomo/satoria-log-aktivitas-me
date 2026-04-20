"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState(""); // Bisa Nama atau NIK
  const [password, setPassword] = useState(""); // Password dari kolom baru
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSFiqIgJQyYtrSJZKYaIeA5ANpzmRSBdBVA_PiO_u1Y2hrFAXHcFYrEUY9EmTTWU9ztg/exec";

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          username: username,
          password: password 
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        // Log ini akan membuktikan apakah Group "Admin" benar-benar terbaca!
        console.log("DATA DITERIMA DARI SERVER:", result.data);
        
        localStorage.setItem("userData", JSON.stringify(result.data));
        // Memicu trigger storage manual agar Sidebar langsung sadar ada data baru
        window.dispatchEvent(new Event("storage"));
        
        router.push("/dashboard");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Koneksi gagal:", error);
      alert("Gagal terhubung ke database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#FAFAFA]">
      <div className="absolute top-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-[#FFD32A] rounded-full mix-blend-multiply filter blur-[180px] opacity-30 animate-[pulse_8s_ease-in-out_infinite] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[180px] opacity-20 pointer-events-none"></div>
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <div className="relative z-10 w-full max-w-[440px] p-10 mx-4 bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-5 w-full flex justify-center items-center h-16 group cursor-pointer">
            <Image
              src="/logo-satoria.png"
              alt="Logo Satoria"
              width={180} 
              height={50}
              className="object-contain max-h-full w-auto drop-shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 pb-1">
            Log Aktivitas
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Masuk dengan Nama/NIK dan Password
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5 group">
            <label className="block text-sm font-bold text-gray-700 ml-1">Nama atau NIK</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full pl-11 pr-5 py-4 bg-white/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] transition-all text-gray-900 shadow-sm font-medium"
                required
                placeholder="Contoh: John atau 12345"
              />
            </div>
          </div>

          <div className="space-y-1.5 group">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-11 pr-5 py-4 bg-white/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#FFD32A]/30 focus:border-[#FFD32A] transition-all text-gray-900 shadow-sm font-medium"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex justify-center items-center gap-2 py-4 px-4 font-extrabold rounded-2xl text-black bg-gradient-to-r from-[#FFD32A] to-[#ffda47] hover:shadow-[0_15px_25px_-10px_rgba(255,211,42,1)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-70"
            >
              {isLoading ? "Memproses..." : "Masuk ke Sistem"}
              {!isLoading && (
                <svg className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}