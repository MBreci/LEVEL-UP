import { Suspense } from "react";
import "./admin-partido.css";
import { AdminPartidoConsole } from "@/components/admin/partido/AdminPartidoConsole";

export default function AdminPartidoPage() {
  return (
    <Suspense fallback={null}>
      <AdminPartidoConsole />
    </Suspense>
  );
}
