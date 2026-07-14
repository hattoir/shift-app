'use client';
import { useEffect, useState } from 'react';
import { WD, monthStr, monthDays, dateStr } from '@/lib/calendar';

export default function Home() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    fetch('/api/shifts?month=' + monthStr(y, m)).then((r) => r.json()).then((d) => setShifts(Array.isArray(d) ? d : []));
  }, [y, m]);

  const move = (diff) => {
    const d = new Date(y, m - 1 + diff, 1);
    setY(d.getFullYear()); setM(d.getMonth() + 1);
  };

  const find = (date, slot) => shifts.find((s) => s.date === date && s.slot === slot);

  return (
    <div>
      <h1>シフト表</h1>
      <div className="month-nav">
        <button onClick={() => move(-1)}>← 前月</button>
        <span className="month-label">{y}年{m}月</span>
        <button onClick={() => move(1)}>翌月 →</button>
      </div>
      <div className="legend">🌅 早番 / 🌙 遅番</div>
      <div className="cal">
        {WD.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {monthDays(y, m).map((d, i) => {
          if (!d) return <div key={'e' + i} className="cell empty" />;
          const date = dateStr(y, m, d);
          const wd = new Date(y, m - 1, d).getDay();
          const e = find(date, 'early'), l = find(date, 'late');
          return (
            <div key={date} className={'cell' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')}>
              <div className="d">{d}</div>
              <span className={'slot early' + (e ? '' : ' none')}>🌅 {e?.members?.name || '未定'}</span>
              <span className={'slot late' + (l ? '' : ' none')}>🌙 {l?.members?.name || '未定'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
