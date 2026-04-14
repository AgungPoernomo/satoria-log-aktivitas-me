import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Baris ini memberi tahu Tailwind untuk mencari class di dalam folder src
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;