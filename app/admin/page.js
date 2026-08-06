'use client';
import { useEffect, useState } from 'react';
import { WD, monthStr, monthDays, dateStr } from '@/lib/calendar';
import { getJson, postJson } from '@/lib/api';

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [tab, setTab] = useState('shift');

  const login = async (e) => {
    e.preventDefault(); setMsg(null);
    const { error } = await postJson('/api/admin/login', { password });
    if (error) setMsg({ t: 'err', text: error });
    else setAuthed(true);
  };

  if (!authed) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
        <h1>管理者ログイン</h1>
        <form onSubmit={login}>
          <div className="row">
            <input type="password" placeholder="パスワード" value={password}
              onChange={(e) => setPassword(e.target.value)} style={{ flex: 1 }} />
          </div>
          <button className="primary" type="submit">ログイン</button>
        </form>
        {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}
      </div>
    );
  }

  return (
    <div>
      <h1>管理者ページ</h1>
      <div className="tabs">
        <button className={tab === 'shift' ? 'active' : ''} onClick={() => setTab('shift')}>シフト作成</button>
        <button className={tab === 'members' ? 'active' : ''} onClick={() => setTab('members')}>メンバー</button>
        <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>固定ルール</button>
      </div>
      {tab === 'shift' && <ShiftEditor />}
      {tab === 'members' && <Members />}
      {tab === 'rules' && <Rules />}
    </div>
  );
}

function ShiftEditor() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [members, setMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [avail, setAvail] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    const mo = monthStr(y, m);
    getJson('/api/shifts?month=' + mo).then(({ data, error }) => {
      if (error) setMsg({ t: 'err', text: 'シフト読み込みエラー: ' + error });
      setShifts(Array.isArray(data) ? data : []);
    });
    getJson('/api/availability?month=' + mo).then(({ data }) => setAvail(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    getJson('/api/members').then(({ data, error }) => {
      if (error) setMsg({ t: 'err', text: 'メンバー読み込みエラー: ' + error });
      setMembers(Array.isArray(data) ? data : []);
    });
  }, []);
  useEffect(load, [y, m]);

  const move = (diff) => {
    const d = new Date(y, m - 1 + diff, 1);
    setY(d.getFullYear()); setM(d.getMonth() + 1);
  };

  const autoAssign = async () => {
    setBusy(true); setMsg(null);
    const { data, error } = await postJson('/api/admin/assign', { month: monthStr(y, m) });
    setBusy(false);
    setMsg(error ? { t: 'err', text: '失敗: ' + error } : { t: 'ok', text: data.assigned + '枠を自動割当しました' });
    load();
  };

  const setShift = async (date, slot, member_id) => {
    const { error } = await postJson('/api/admin/shift', { date, slot, member_id: member_id || null });
    if (error) setMsg({ t: 'err', text: '保存に失敗: ' + error });
    load();
  };

  const find = (date, slot) => shifts.find((s) => s.date === date && s.slot === slot);
  const canWork = (date, slot, memberId) =>
    avail.some((a) => a.member_id === memberId && a.date === date && (a.slot === slot || a.slot === 'both'));

  return (
    <div>
      <div className="month-nav">
        <button onClick={() => move(-1)}>← 前月</button>
        <span className="month-label">{y}年{m}月</span>
        <button onClick={() => move(1)}>翌月 →</button>
        <button className="primary" onClick={autoAssign} disabled={busy}>
          {busy ? '割当中...' : '🪄 自動割当'}
        </button>
      </div>
      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}
      <div className="legend">✓=その日入れる希望あり / 手動で選ぶと固定🔒され、自動割当で上書きされません(空欄に戻すと解除)</div>
      <div className="cal">
        {WD.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {monthDays(y, m).map((d, i) => {
          if (!d) return <div key={'e' + i} className="cell empty" />;
          const date = dateStr(y, m, d);
          const wd = new Date(y, m - 1, d).getDay();
          return (
            <div key={date} className={'cell' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')}>
              <div className="d">{d}{find(date, 'early')?.locked || find(date, 'late')?.locked ? ' 🔒' : ''}</div>
              {['early', 'late'].map((slot) => (
                <select key={slot} className="pick" value={find(date, slot)?.member_id || ''}
                  onChange={(e) => setShift(date, slot, e.target.value)}>
                  <option value="">{slot === 'early' ? '🌅 —' : '🌙 —'}</option>
                  {members.map((mb) => (
                    <option key={mb.id} value={mb.id}>
                      {(canWork(date, slot, mb.id) ? '✓ ' : '') + mb.name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Members() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);

  const load = () => getJson('/api/members').then(({ data, error }) => {
    if (error) setMsg({ t: 'err', text: '読み込みエラー: ' + error });
    setMembers(Array.isArray(data) ? data : []);
  });
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setMsg(null);
    const { error } = await postJson('/api/members', { name });
    if (error) setMsg({ t: 'err', text: '追加に失敗: ' + error });
    else { setName(''); setMsg({ t: 'ok', text: '追加しました' }); load(); }
  };

  const del = async (id, nm) => {
    if (!confirm(nm + ' を削除しますか?(希望日・シフトも消えます)')) return;
    const { error } = await postJson('/api/members', { id }, 'DELETE');
    if (error) setMsg({ t: 'err', text: '削除に失敗: ' + error });
    load();
  };

  return (
    <div className="card">
      <h2>メンバー管理</h2>
      <form onSubmit={add} className="row">
        <input type="text" placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" type="submit">追加</button>
      </form>
      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}
      <ul className="plain">
        {members.map((mb) => (
          <li key={mb.id}>{mb.name}<button className="danger" onClick={() => del(mb.id, mb.name)}>削除</button></li>
        ))}
      </ul>
    </div>
  );
}

function Rules() {
  const [rules, setRules] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [weekday, setWeekday] = useState('1');
  const [slot, setSlot] = useState('both');
  const [msg, setMsg] = useState(null);

  const load = () => getJson('/api/rules').then(({ data, error }) => {
    if (error) setMsg({ t: 'err', text: '読み込みエラー: ' + error });
    setRules(Array.isArray(data) ? data : []);
  });
  useEffect(() => {
    load();
    getJson('/api/members').then(({ data }) => setMembers(Array.isArray(data) ? data : []));
  }, []);

  const add = async (e) => {
    e.preventDefault(); setMsg(null);
    if (!memberId) { setMsg({ t: 'err', text: 'メンバーを選んでください' }); return; }
    const { error } = await postJson('/api/rules', { member_id: memberId, weekday: Number(weekday), slot });
    if (error) setMsg({ t: 'err', text: '追加に失敗: ' + error });
    load();
  };

  const del = async (id) => {
    const { error } = await postJson('/api/rules', { id }, 'DELETE');
    if (error) setMsg({ t: 'err', text: '削除に失敗: ' + error });
    load();
  };

  const SLOT_LABEL = { both: 'どちらでも', early: '早番', late: '遅番' };

  return (
    <div className="card">
      <h2>固定ルール(この曜日はこの人)</h2>
      <div className="legend">自動割当のとき、希望日より優先して割り当てられます</div>
      <form onSubmit={add} className="row">
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">メンバー</option>
          {members.map((mb) => <option key={mb.id} value={mb.id}>{mb.name}</option>)}
        </select>
        <select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
          {WD.map((w, i) => <option key={i} value={i}>{w}曜日</option>)}
        </select>
        <select value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="both">どちらでも</option>
          <option value="early">早番</option>
          <option value="late">遅番</option>
        </select>
        <button className="primary" type="submit">追加</button>
      </form>
      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}
      <ul className="plain">
        {rules.map((r) => (
          <li key={r.id}>
            <span>{WD[r.weekday]}曜日: {r.members?.name}({SLOT_LABEL[r.slot]})</span>
            <button className="danger" onClick={() => del(r.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
