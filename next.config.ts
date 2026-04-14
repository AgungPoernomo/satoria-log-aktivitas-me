/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! PERINGATAN !!
    // Ini akan mengabaikan error TypeScript saat proses build di Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Mengabaikan peringatan ESLint saat build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;