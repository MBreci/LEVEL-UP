import { ConfiguracionForm } from "@/components/configuracion/ConfiguracionForm";

export default function ConfiguracionPage() {
  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">CONFIGURACIÓN</div>
        <div className="page-banner-title">CONFIGURACIÓN</div>
        <div className="page-banner-desc">Edita los datos básicos de tu perfil.</div>
      </div>
      <ConfiguracionForm />
    </>
  );
}
