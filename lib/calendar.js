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

// '2026-09' -> '2026年9月'
export function monthLabel(month) {
  const [y, m] = String(month || '').split('-').map(Number);
  if (!y || !m) return String(month || '');
  return y + '年' + m + '月';
}

// '2026-09-15' -> '9月15日(火)'
export function dateLabel(date) {
  const [y, m, d] = String(date || '').split('-').map(Number);
  if (!y || !m || !d) return String(date || '');
  return m + '月' + d + '日(' + WD[new Date(y, m - 1, d).getDay()] + ')';
}

// 今日の日付を '2026-09-15' の形で返す
export function todayStr() {
  const d = new Date();
  return dateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// '2026-09-15' -> 2 (0=日 ... 6=土)
export function weekdayOf(date) {
  const [y, m, d] = String(date || '').split('-').map(Number);
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getDay();
}
