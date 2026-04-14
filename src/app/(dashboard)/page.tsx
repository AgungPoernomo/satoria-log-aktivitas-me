import { redirect } from "next/navigation";

export default function RootPage() {
  // Otomatis arahkan siapa saja yang membuka halaman depan ke halaman login
  redirect("/login");
}