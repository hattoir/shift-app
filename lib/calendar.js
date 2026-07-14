export const WD = ['日', '月', '火', '水', '木', '金', '土'];

export function monthStr(y, m) {
  return y + '-' + String(m).padStart(2, '0');
}

export function useMonthState(now = new Date()) {
  return { y: now.getFullYear(), m: now.getMonth() + 1 };
}

export function monthDays(y, m) {
  const n = new Date(y, m, 0).getDate();
  const first = new Date(y, m - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= n; d++) cells.push(d);
  return cells;
}

export function dateStr(y, m, d) {
  return monthStr(y, m) + '-' + String(d).padStart(2, '0');
}
