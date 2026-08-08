'use client';
import { useCallback, useEffect, useState } from 'react';
import { WD, monthStr, monthDays, dateStr, dateLabel, weekdayOf, todayStr } from '@/lib/calendar';
import {
  SlotIcon, SLOT_NAME, IconSun, IconMoon, IconCheck, IconX, IconLock, IconUnlock,
  IconRefresh, IconSparkle, IconClose, IconChevronRight, IconChevronDown,
  IconArrowLeft, IconArrowRight, IconTrash,
} from '@/lib/icons';
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

/* ------------------------------------------------------------------ */
/* シフト作成                                                          */
/* ------------------------------------------------------------------ */

function ShiftEditor() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [members, setMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [avail, setAvail] = useState([]);
  const [rules, setRules] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [report, setReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const label = y + '年' + m + '月';

  const load = useCallback(async () => {
    setLoading(true);
    const mo = monthStr(y, m);
    const [sh, av, mb, ru] = await Promise.all([
      getJson('/api/shifts?month=' + mo),
      getJson('/api/availability?month=' + mo),
      getJson('/api/members'),
      getJson('/api/rules'),
    ]);
    const err = sh.error || av.error || mb.error || ru.error;
    if (err) setMsg({ t: 'err', text: '読み込みエラー: ' + err });
    setShifts(Array.isArray(sh.data) ? sh.data : []);
    setAvail(Array.isArray(av.data) ? av.data : []);
    setMembers(Array.isArray(mb.data) ? mb.data : []);
    setRules(Array.isArray(ru.data) ? ru.data : []);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [y, m]);

  useEffect(() => { load(); }, [load]);

  const move = (diff) => {
    const d = new Date(y, m - 1 + diff, 1);
    setY(d.getFullYear()); setM(d.getMonth() + 1);
    setMsg(null); setReport(null);
  };

  const autoAssign = async () => {
    const ok = confirm(
      label + 'のシフトを自動割当します。\n' +
      '手動で固定した枠(カギのマークが付いた枠)以外は上書きされます。よろしいですか?'
    );
    if (!ok) return;

    setBusy(true); setMsg(null); setReport(null);
    const { data, error } = await postJson('/api/admin/assign', { month: monthStr(y, m) });
    setBusy(false);

    if (error) {
      setMsg({ t: 'err', text: '失敗: ' + error });
    } else if (data.assigned === 0) {
      setMsg({
        t: 'err',
        text: (data.monthLabel || label) + 'は1枠も割り当てできませんでした。'
          + '希望日が登録されていないか、全員が「入れない」になっている可能性があります。',
      });
      setReport(data);
    } else {
      setMsg({ t: 'ok', text: (data.monthLabel || label) + 'に' + data.assigned + '枠を割り当てました' });
      setReport(data);
    }
    await load();
  };

  const find = (date, slot) => shifts.find((s) => s.date === date && s.slot === slot);
  const today = todayStr();

  return (
    <div>
      <div className="month-nav">
        <button onClick={() => move(-1)}><IconArrowLeft />前月</button>
        <span className="month-label">{label}</span>
        <button onClick={() => move(1)}>翌月<IconArrowRight /></button>
        <button onClick={load} disabled={loading}><IconRefresh />{loading ? '更新中...' : '更新'}</button>
      </div>
      <div className="row">
        <button className="primary" onClick={autoAssign} disabled={busy}>
          <IconSparkle size={17} />{busy ? '割当中...' : label + 'を自動割当'}
        </button>
      </div>

      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}

      {report && (
        <div className="card">
          <button className="link-btn" onClick={() => setShowReport(!showReport)}>
            {showReport ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
            自動割当のくわしい結果を見る
          </button>
          {showReport && (
            <div style={{ marginTop: 10 }}>
              <ul className="plain">
                <li><span>対象の月</span><span>{report.monthLabel}({report.range?.from} 〜 {report.range?.to})</span></li>
                <li><span>割り当てた枠</span><span>{report.assigned} 枠</span></li>
                <li><span>手動で固定されていた枠</span><span>{report.kept} 枠</span></li>
                <li><span>この月の全部の枠</span><span>{report.total} 枠</span></li>
                <li><span>埋まらなかった枠</span><span>{report.skipped?.length || 0} 枠</span></li>
              </ul>
              {!!report.skipped?.length && (
                <>
                  <div className="legend">埋まらなかった枠と、その理由:</div>
                  <ul className="plain small">
                    {report.skipped.map((s, i) => (
                      <li key={i}>
                        <span>{dateLabel(s.date)} {s.slotLabel}</span>
                        <span style={{ textAlign: 'right' }}>{s.reason}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="legend legend-ic">
        日付をタップすると、その日の担当を変更できます。<IconLock size={13} />は手動で固定した枠
        (自動割当で上書きされません)。
        {updatedAt && ' 最終更新 ' + updatedAt.toLocaleTimeString('ja-JP')}
      </div>

      <div className="cal">
        {WD.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {monthDays(y, m).map((d, i) => {
          if (!d) return <div key={'e' + i} className="cell empty" />;
          const date = dateStr(y, m, d);
          const wd = new Date(y, m - 1, d).getDay();
          const e = find(date, 'early'), l = find(date, 'late');
          return (
            <div key={date} onClick={() => setEditDate(date)} role="button" tabIndex={0}
              onKeyDown={(ev) => { if (ev.key === 'Enter') setEditDate(date); }}
              className={'cell tap-cell' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')
                + (date === today ? ' today' : '')}>
              <div className="d">{d}</div>
              <span className={'slot early' + (e?.members?.name ? '' : ' none')}>
                <IconSun size={11} /><span className="nm">{e?.members?.name || '未定'}</span>
                {e?.locked && <IconLock size={10} className="lk" />}
              </span>
              <span className={'slot late' + (l?.members?.name ? '' : ' none')}>
                <IconMoon size={11} /><span className="nm">{l?.members?.name || '未定'}</span>
                {l?.locked && <IconLock size={10} className="lk" />}
              </span>
            </div>
          );
        })}
      </div>

      {editDate && (
        <DayEditor
          date={editDate}
          members={members}
          shifts={shifts}
          avail={avail}
          rules={rules}
          onClose={() => setEditDate(null)}
          onSaved={async () => { setEditDate(null); await load(); }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1日分の編集ダイアログ                                                */
/* ------------------------------------------------------------------ */

/* 見出しは <SlotIcon> + SLOT_NAME で組み立てます(lib/icons.js) */

function DayEditor({ date, members, shifts, avail, rules, onClose, onSaved }) {
  const original = (slot) => {
    const s = shifts.find((x) => x.date === date && x.slot === slot);
    return { member_id: s?.member_id || '', locked: !!s?.locked };
  };

  const [draft, setDraft] = useState({ early: original('early'), late: original('late') });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const wd = weekdayOf(date);
  const availOf = (id) => avail.find((a) => a.member_id === id && a.date === date)?.slot || null;
  const ruleOf = (id) => rules.find((r) => r.member_id === id && r.weekday === wd) || null;

  // その人がその枠でどういう状態かを判定する
  const statusOf = (id, slot) => {
    const a = availOf(id);
    const r = ruleOf(id);
    if (a === 'off') return { tone: 'off', label: '入れない', Ic: IconX };
    if (r && r.kind === 'off') return { tone: 'off', label: WD[wd] + '曜NG', Ic: IconX };
    if (r && r.kind !== 'off' && (r.slot === slot || r.slot === 'both')) return { tone: 'fixed', label: '固定', Ic: IconLock };
    if (a === 'both') return { tone: 'ok', label: '空きあり', Ic: IconCheck };
    if (a === 'early') return { tone: slot === 'early' ? 'ok' : 'weak', label: '早のみ', Ic: IconSun };
    if (a === 'late') return { tone: slot === 'late' ? 'ok' : 'weak', label: '遅のみ', Ic: IconMoon };
    return { tone: 'none', label: '希望なし', Ic: null };
  };

  const pick = (slot, id) => {
    setErr(null);
    setDraft((p) => ({
      ...p,
      // 同じ人をもう一度押したら選択解除
      [slot]: p[slot].member_id === id
        ? { member_id: '', locked: p[slot].locked }
        : { member_id: id, locked: true }, // 手動で選んだ枠は自動的に固定する
    }));
  };

  const clearSlot = (slot) => {
    setErr(null);
    setDraft((p) => ({ ...p, [slot]: { member_id: '', locked: false } }));
  };

  const toggleLock = (slot) => {
    setErr(null);
    setDraft((p) => ({ ...p, [slot]: { ...p[slot], locked: !p[slot].locked } }));
  };

  const save = async () => {
    // 変わった枠だけを、1日ぶんまとめて送る(早番と遅番の入れ替えも1回で済む)
    const slots = ['early', 'late']
      .filter((slot) => {
        const cur = draft[slot], org = original(slot);
        return cur.member_id !== org.member_id || cur.locked !== org.locked;
      })
      .map((slot) => ({ slot, member_id: draft[slot].member_id || null, locked: draft[slot].locked }));

    if (!slots.length) { onClose(); return; }

    setSaving(true); setErr(null);
    const { error } = await postJson('/api/admin/shift', { date, slots });
    setSaving(false);
    if (error) { setErr('保存に失敗: ' + error); return; }
    onSaved();
  };

  const nameOf = (id) => members.find((mb) => mb.id === id)?.name || '';

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{dateLabel(date)}</h2>
          <button className="modal-x" onClick={onClose} aria-label="閉じる"><IconClose size={17} /></button>
        </div>

        <div className="modal-body">
          {['early', 'late'].map((slot) => {
            const other = slot === 'early' ? 'late' : 'early';
            const cur = draft[slot];
            return (
              <div key={slot} className="slot-section">
                <div className="slot-title">
                  <span className="slot-name"><SlotIcon slot={slot} size={17} />{SLOT_NAME[slot]}</span>
                  <span className="slot-current">
                    {cur.member_id ? nameOf(cur.member_id) : '未定'}
                  </span>
                </div>

                {!members.length && <div className="legend">メンバーが登録されていません</div>}

                <div className="pick-grid">
                  {members.map((mb) => {
                    const st = statusOf(mb.id, slot);
                    const usedInOther = draft[other].member_id === mb.id;
                    const selected = cur.member_id === mb.id;
                    return (
                      <button
                        key={mb.id}
                        type="button"
                        className={'pick-btn tone-' + st.tone + (selected ? ' selected' : '')}
                        disabled={usedInOther}
                        title={usedInOther ? 'もう一方の枠に入っています' : ''}
                        onClick={() => pick(slot, mb.id)}
                      >
                        <span className="pick-name">{mb.name}</span>
                        <span className="pick-tag">
                          {usedInOther
                            ? <><SlotIcon slot={other} size={11} />{SLOT_NAME[other]}に選択中</>
                            : <>{st.Ic && <st.Ic size={11} />}{st.label}</>}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="slot-actions">
                  <button type="button" className="mini" onClick={() => clearSlot(slot)}>
                    未定に戻す(クリア)
                  </button>
                  <button
                    type="button"
                    className={'mini lock-toggle' + (cur.locked ? ' on' : '')}
                    onClick={() => toggleLock(slot)}
                  >
                    {cur.locked
                      ? <><IconLock size={14} />固定中(自動割当で上書きしない)</>
                      : <><IconUnlock size={14} />固定しない</>}
                  </button>
                </div>
              </div>
            );
          })}

          {err && <div className="msg err">{err}</div>}
        </div>

        <div className="modal-foot">
          <button type="button" className="mini" onClick={onClose}>閉じる</button>
          <button type="button" className="primary" onClick={save} disabled={saving}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* メンバー                                                            */
/* ------------------------------------------------------------------ */

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
          <li key={mb.id}>
            {mb.name}
            <button className="danger" onClick={() => del(mb.id, mb.name)}><IconTrash size={14} />削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 固定ルール                                                          */
/* ------------------------------------------------------------------ */

const SLOT_LABEL = { both: 'どちらでも', early: '早番', late: '遅番' };

function Rules() {
  const [rules, setRules] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [weekday, setWeekday] = useState('1');
  const [slot, setSlot] = useState('both');
  const [kind, setKind] = useState('assign');
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
    const { error } = await postJson('/api/rules', {
      member_id: memberId, weekday: Number(weekday), slot, kind,
    });
    if (error) setMsg({ t: 'err', text: '追加に失敗: ' + error });
    else setMsg({ t: 'ok', text: '登録しました' });
    load();
  };

  const del = async (id) => {
    const { error } = await postJson('/api/rules', { id }, 'DELETE');
    if (error) setMsg({ t: 'err', text: '削除に失敗: ' + error });
    load();
  };

  return (
    <div className="card">
      <h2>固定ルール(曜日ごとの決まりごと)</h2>
      <div className="legend">
        「入れる」ルール… 自動割当のとき、希望日より優先して割り当てます。<br />
        「入れない」ルール… その曜日は自動割当で絶対に割り当てません。<br />
        ※ 1人につき1曜日に1つだけ登録できます(同じ曜日にもう一度登録すると上書きされます)。
      </div>

      <form onSubmit={add}>
        <div className="row">
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">メンバーを選ぶ</option>
            {members.map((mb) => <option key={mb.id} value={mb.id}>{mb.name}</option>)}
          </select>
          <select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
            {WD.map((w, i) => <option key={i} value={i}>{w}曜日</option>)}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="assign">は この曜日に入れる</option>
            <option value="off">は この曜日は入れない</option>
          </select>
          {kind === 'assign' && (
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              <option value="both">どちらでも</option>
              <option value="early">早番</option>
              <option value="late">遅番</option>
            </select>
          )}
          <button className="primary" type="submit">登録</button>
        </div>
      </form>

      {msg && <div className={'msg ' + msg.t}>{msg.text}</div>}

      {!rules.length && <div className="legend">まだルールがありません</div>}

      {WD.map((w, i) => {
        const list = rules.filter((r) => r.weekday === i);
        if (!list.length) return null;
        return (
          <div key={i} className="rule-group">
            <h3 className="rule-head">{w}曜日</h3>
            <ul className="plain">
              {list.map((r) => (
                <li key={r.id}>
                  <span>
                    <span className={'rule-badge ' + (r.kind === 'off' ? 'off' : 'assign')}>
                      {r.kind === 'off' ? <IconX size={11} /> : <IconCheck size={11} />}
                      {r.kind === 'off' ? '入れない' : '入れる'}
                    </span>
                    {r.members?.name}
                    {r.kind !== 'off' && '(' + SLOT_LABEL[r.slot] + ')'}
                  </span>
                  <button className="danger" onClick={() => del(r.id)}><IconTrash size={14} />削除</button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
