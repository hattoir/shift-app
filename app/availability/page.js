'use client';
import { useEffect, useState } from 'react';
import { WD, monthStr, monthDays, dateStr } from '@/lib/calendar';
import { getJson, postJson } from '@/lib/api';

// 日付をタップするたびに、この順番で切り替わる
const CYCLE = { none: 'both', both: 'early', early: 'late', late: 'off', off: 'none' };
const MARK = { none: '', both: '○', early: '早', late: '遅', off: '✕' };

export default function Availability() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [marks, setMarks] = useState({});
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bulk, setBulk] = useState(false);

  useEffect(() => {
    getJson('/api/members').then(({ data, error }) => {
      if (error) setMsg({ t: 'err', text: 'メンバー読み込みエラー: ' + error });
      setMembers(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    if (!memberId) { setMarks({}); return; }
    getJson('/api/availability?month=' + monthStr(y, m) + '&member_id=' + memberId)
      .then(({ data, error }) => {
        if (error) { setMsg({ t: 'err', text: '読み込みエラー: ' + error }); return; }
        const o = {};
        (Array.isArray(data) ? data : []).forEach((a) => { o[a.date] = a.slot; });
        setMarks(o);
      });
  }, [memberId, y, m]);

  const move = (diff) => {
    const d = new Date(y, m - 1 + diff, 1);
    setY(d.getFullYear()); setM(d.getMonth() + 1);
    setMsg(null);
  };

  const requireMember = () => {
    if (memberId) return true;
    setMsg({ t: 'err', text: '先に名前を選んでください' });
    return false;
  };

  const toggle = (date) => {
    if (!requireMember()) return;
    setMarks((prev) => {
      const next = { ...prev };
      const s = CYCLE[prev[date] || 'none'];
      if (s === 'none') delete next[date]; else next[date] = s;
      return next;
    });
  };

  // まとめて入力(日付の配列に同じ印を付ける)
  const setMany = (days, slot) => {
    if (!requireMember()) return;
    setMarks((prev) => {
      const next = { ...prev };
      days.forEach((d) => {
        const date = dateStr(y, m, d);
        if (slot === 'none') delete next[date]; else next[date] = slot;
      });
      return next;
    });
  };

  const cells = monthDays(y, m);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const allDays = cells.filter(Boolean);

  const save = async () => {
    setMsg(null); setSaving(true);
    const entries = Object.entries(marks).map(([date, slot]) => ({ date, slot }));
    const { error } = await postJson('/api/availability', {
      member_id: memberId, month: monthStr(y, m), entries,
    });
    setSaving(false);
    setMsg(error
      ? { t: 'err', text: '保存に失敗: ' + error }
      : { t: 'ok', text: y + '年' + m + '月の希望を保存しました!(' + entries.length + '日分)' });
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
        {!members.length && <div className="legend">※ 名前が出ない場合は、管理者がまだメンバーを登録していません</div>}
        <div className="legend"><b>日付をタップするたびに切り替わります</b></div>
        <div className="chips">
          <span className="chip m-both">○ どちらでもOK</span>
          <span className="chip m-early">早 早番だけ</span>
          <span className="chip m-late">遅 遅番だけ</span>
          <span className="chip m-off">✕ この日は入れない</span>
          <span className="chip m-none">なし(未入力)</span>
        </div>
        <div className="legend">
          ✕ を付けた日は、固定ルールがあっても自動割当で入れられません。
        </div>
      </div>

      <div className="month-nav">
        <button onClick={() => move(-1)}>← 前月</button>
        <span className="month-label">{y}年{m}月</span>
        <button onClick={() => move(1)}>翌月 →</button>
      </div>

      <div className="cal">
        {WD.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={'e' + i} className="cell empty" />;
          const date = dateStr(y, m, d);
          const wd = new Date(y, m - 1, d).getDay();
          const mk = marks[date] || 'none';
          return (
            <div key={date} onClick={() => toggle(date)}
              className={'cell avail-cell mark-' + mk + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')}>
              <div className="d">{d}</div>
              <div className="mark">{MARK[mk]}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <button className="link-btn" onClick={() => setBulk(!bulk)}>
          {bulk ? '▼' : '▶'} まとめて入力する
        </button>
        {bulk && (
          <div style={{ marginTop: 12 }}>
            <div className="legend">この月ぜんぶ</div>
            <div className="chips">
              <button className="mini" onClick={() => setMany(allDays, 'both')}>ぜんぶ ○</button>
              <button className="mini danger-btn" onClick={() => setMany(allDays, 'off')}>ぜんぶ ✕</button>
              <button className="mini" onClick={() => setMany(allDays, 'none')}>ぜんぶ消す</button>
            </div>
            <div className="legend" style={{ marginTop: 12 }}>週ごと</div>
            {weeks.map((w, i) => {
              const days = w.filter(Boolean);
              if (!days.length) return null;
              return (
                <div key={i} className="chips" style={{ marginBottom: 6 }}>
                  <span className="week-label">{days[0]}日〜{days[days.length - 1]}日</span>
                  <button className="mini" onClick={() => setMany(days, 'both')}>○</button>
                  <button className="mini danger-btn" onClick={() => setMany(days, 'off')}>✕</button>
                  <button className="mini" onClick={() => setMany(days, 'none')}>消す</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="primary" onClick={save} disabled={!memberId || saving}>
          {saving ? '保存中...' : 'この月の希望を保存'}
        </button>
      </div>
      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}
    </div>
  );
}
