// '2026-09' -> { from: '2026-09-01', to: '2026-09-30' }
export function monthRange(month) {
  const [y, m] = String(month || '').split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${last}` };
}
