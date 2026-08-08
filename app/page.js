'use client';
import { useCallback, useEffect, useState } from 'react';
import { WD, monthStr, monthDays, dateStr, todayStr } from '@/lib/calendar';
import { IconSun, IconMoon, IconRefresh, IconArrowLeft, IconArrowRight } from '@/lib/icons';
import { getJson } from '@/lib/api';

export default function Home() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [shifts, setShifts] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getJson('/api/shifts?month=' + monthStr(y, m));
    setErr(error);
    setShifts(Array.isArray(data) ? data : []);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [y, m]);

  useEffect(() => { load(); }, [load]);

  // 別のタブや画面から戻ってきたときに自動で最新を取り直す
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const move = (diff) => {
    const d = new Date(y, m - 1 + diff, 1);
    setY(d.getFullYear()); setM(d.getMonth() + 1);
  };
  const find = (date, slot) => shifts.find((s) => s.date === date && s.slot === slot);
  const today = todayStr();

  const filled = shifts.filter((s) => s.member_id).length;

  return (
    <div>
      <h1>シフト表</h1>
      <div className="month-nav">
        <button onClick={() => move(-1)}><IconArrowLeft />前月</button>
        <span className="month-label">{y}年{m}月</span>
        <button onClick={() => move(1)}>翌月<IconArrowRight /></button>
        <button onClick={load} disabled={loading}><IconRefresh />{loading ? '更新中...' : '更新'}</button>
      </div>
      {err && <div className="msg err">読み込みエラー: {err}</div>}
      <div className="legend legend-ic">
        <IconSun /> 早番 / <IconMoon /> 遅番 ・ この月は {filled} 枠が決まっています
        {updatedAt && ' ・ 最終更新 ' + updatedAt.toLocaleTimeString('ja-JP')}
      </div>
      <div className="cal">
        {WD.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {monthDays(y, m).map((d, i) => {
          if (!d) return <div key={'e' + i} className="cell empty" />;
          const date = dateStr(y, m, d);
          const wd = new Date(y, m - 1, d).getDay();
          const e = find(date, 'early'), l = find(date, 'late');
          return (
            <div key={date} className={'cell' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')
              + (date === today ? ' today' : '')}>
              <div className="d">{d}</div>
              <span className={'slot early' + (e?.members?.name ? '' : ' none')}>
                <IconSun size={11} /><span className="nm">{e?.members?.name || '未定'}</span>
              </span>
              <span className={'slot late' + (l?.members?.name ? '' : ' none')}>
                <IconMoon size={11} /><span className="nm">{l?.members?.name || '未定'}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
