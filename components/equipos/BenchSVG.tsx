export function BenchSVG() {
  const seats = 9;
  const x0 = 28,
    w = 944,
    top = 16,
    backH = 30,
    baseY = 48,
    baseH = 13;
  const seatW = w / seats;
  let parts = "";
  parts += `<rect x="${x0 - 6}" y="2" width="${w + 12}" height="8" rx="4" fill="url(#bRoof)" stroke="rgba(95,160,240,0.22)" stroke-width="0.8"/>`;
  let x = x0;
  for (let i = 0; i < seats; i++) {
    x = x0 + seatW * i;
    const pad = 5;
    const sx = x + pad,
      sw = seatW - pad * 2;
    const cx = x + seatW / 2;
    parts += `<rect x="${cx - sw * 0.22}" y="${top - 7}" width="${sw * 0.44}" height="14" rx="6" fill="url(#bSeat)" stroke="rgba(95,160,240,0.28)" stroke-width="0.8"/>`;
    parts += `<rect x="${sx}" y="${top}" width="${sw}" height="${backH}" rx="6" fill="url(#bSeat)" stroke="rgba(95,160,240,0.32)" stroke-width="1"/>`;
    parts += `<rect x="${sx + 3}" y="${top + 4}" width="${sw * 0.32}" height="${backH - 9}" rx="4" fill="rgba(120,185,255,0.10)"/>`;
    parts += `<line x1="${cx}" y1="${top + 6}" x2="${cx}" y2="${top + backH - 5}" stroke="rgba(6,14,28,0.5)" stroke-width="1.5"/>`;
    parts += `<rect x="${sx - 2}" y="${baseY}" width="${sw + 4}" height="${baseH}" rx="4" fill="url(#bBase)" stroke="rgba(75,130,200,0.25)" stroke-width="1"/>`;
    parts += `<rect x="${x + 0.5}" y="${baseY - 4}" width="4" height="${baseH + 5}" rx="2" fill="#0c2040"/>`;
    parts += `<rect x="${cx - 2}" y="${baseY + baseH}" width="4" height="8" fill="#0a1830"/>`;
  }
  parts += `<rect x="${x + seatW - 4.5}" y="${baseY - 4}" width="4" height="${baseH + 5}" rx="2" fill="#0c2040"/>`;
  const svg = `<svg class="bench-svg" viewBox="0 0 1000 72" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bSeat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a5392"/><stop offset="0.55" stop-color="#173563"/><stop offset="1" stop-color="#0e2244"/>
      </linearGradient>
      <linearGradient id="bBase" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1b3d6c"/><stop offset="1" stop-color="#0a1d3c"/>
      </linearGradient>
      <linearGradient id="bRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1e3f70"/><stop offset="1" stop-color="#0c1f3a"/>
      </linearGradient>
    </defs>
    ${parts}
  </svg>`;

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
