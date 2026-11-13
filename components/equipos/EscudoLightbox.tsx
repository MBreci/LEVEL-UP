"use client";

export function EscudoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="modal-overlay open" id="escudo-lightbox">
      <div className="escudo-lightbox-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="escudo-lightbox-img" className="escudo-lightbox-img" src={src} alt="" />
        <button className="auth-cancel" onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>
  );
}
