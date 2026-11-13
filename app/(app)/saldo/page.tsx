import { SaldoContent } from "@/components/wallet/SaldoContent";

export default function SaldoPage() {
  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">TU BILLETERA LEVEL UP</div>
        <div className="page-banner-title">MIS LEVEL COINS</div>
        <div className="page-banner-desc">Gana coins jugando o cómpralos, y úsalos para torneos, premios y más.</div>
      </div>
      <section id="saldo">
        <SaldoContent />
      </section>
    </>
  );
}
