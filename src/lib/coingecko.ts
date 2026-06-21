// CoinGecko público (sin API key)
export async function fetchCryptoPrices(ids: string[]): Promise<Record<string, number>> {
  if (!ids.length) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("CoinGecko error");
  const j = (await r.json()) as Record<string, { usd: number }>;
  const out: Record<string, number> = {};
  for (const id of ids) if (j[id]) out[id] = j[id].usd;
  return out;
}
