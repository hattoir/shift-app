'use client';
import { useEffect, useState } from 'react';
import { WD, monthStr, monthDays, dateStr } from '@/lib/calendar';

const CYCLE = { none: 'both', both: 'early', early: 'late', late: 'none' };
const MARK = { none: '', both: '○', early: '早', late: '遅' };

export default function Availability() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [marks, setMarks] = useState({}); // { date: slot }
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/members').then((r) => r.json()).then((d) => setMembers(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!memberId) { setMarks({}); return; }
    fetch('/api/availability?month=' + monthStr(y, m) + '&member_id=' + memberId)
      .then((r) => r.json())
      .then((d) => {
        const o = {};
        (Array.isArray(d) ? d : []).forEach((a) => { o[a.date] = a.slot; });
        setMarks(o);
      });
  }, [memberId, y, m]);

  const move = (diff) => {
    const d = new Date(y, m - 1 + diff, 1);
    setY(d.getFullYear()); setM(d.getMonth() + 1);
  };

  const toggle = (date) => {
    if (!memberId) return;
    setMarks((prev) => {
      const next = { ...prev };
      const s = CYCLE[prev[date] || 'none'];
      if (s === 'none') delete next[date]; else next[date] = s;
      return next;
    });
  };

  const save = async () => {
    setMsg(null);
    const entries = Object.entries(marks).map(([date, slot]) => ({ date, slot }));
    const res = await fetch('/api/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, month: monthStr(y, m), entries }),
    });
    setMsg(res.ok ? { t: 'ok', text: '保存しました!' } : { t: 'err', text: '保存に失敗しました' });
  };

  return (
    <div>
      <h1>希望日入力</h1>
      <div className="card">
        <div className="row">
          <label>名前:</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">選んでください</option>
            {members.map((mb) => <option key={mb.id} value={mb.id}>{mb.name}</option>)}
          </select>
        </div>
        <div className="legend">日付をタップ: ○(どちらでも) → 早(早番のみ) → 遅(遅番のみ) → なし</div>
      </div>
      <div className="month-nav">
        <button onClick={() => move(-1)}>← 前月</button>
        <span className="month-label">{y}年{m}月</span>
        <button onClick={() => move(1)}>翌月 →</button>
      </div>
      <div className="cal">
        {WD.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {monthDays(y, m).map((d, i) => {
          if (!d) return <div key={'e' + i} className="cell empty" />;
          const date = dateStr(y, m, d);
          const wd = new Date(y, m - 1, d).getDay();
          return (
            <div key={date} onClick={() => toggle(date)}
              className={'cell avail-cell' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')}>
              <div className="d">{d}</div>
              <div className="mark">{MARK[marks[date] || 'none']}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="primary" onClick={save} disabled={!memberId}>この月の希望を保存</button>
      </div>
      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}
    </div>
  );
}
