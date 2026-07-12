export function formatMoney(amountMinor: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(amountMinor / 100);
}

export function monthRange(month: string) {
  const start = `${month}-01`;
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { start, end };
}
