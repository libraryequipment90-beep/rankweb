export function money(n) {
  if (n == null || Number.isNaN(n)) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export function compact(n) {
  if (n == null || Number.isNaN(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}K`;
  return Math.round(abs).toLocaleString();
}

export function duration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}
