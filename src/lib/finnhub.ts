// Mock Finnhub: drift conservador ±1.5% sobre el precio actual
// para evitar saltos absurdos en el portafolio.
// Cuando agregues FINNHUB_API_KEY como secret en Configuración,
// reemplazar este body por:
//   const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${KEY}`)
//   const j = await r.json(); return j.c;
export async function fetchStockPrice(_symbol: string, current: number) {
  await new Promise((r) => setTimeout(r, 200));
  const drift = (Math.random() - 0.5) * 0.03; // ±1.5%
  return Math.max(0.01, current * (1 + drift));
}
