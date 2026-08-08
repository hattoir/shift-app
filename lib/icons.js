// 画面で使うアイコン。すべて図形(SVG)で描いています。
// 色は文字色をそのまま引き継ぐので(currentColor)、置いた場所になじみます。
// 大きさは size で変えられます(既定 16px)。

function Svg({ size = 16, className, box = 24, children }) {
  return (
    <svg
      className={'icon' + (className ? ' ' + className : '')}
      width={size} height={size}
      viewBox={'0 0 ' + box + ' ' + box}
      fill="currentColor"
      aria-hidden="true" focusable="false"
    >
      {children}
    </svg>
  );
}

/* ---------- 早番 / 遅番 ---------- */

// 太陽(塗り。中央の丸＋8方向の光)
export function IconSun(p) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="5.2" />
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 1.8v2.4M12 19.8v2.4M22.2 12h-2.4M4.2 12H1.8" />
        <path d="M19.4 4.6l-1.5 1.5M6.1 17.9l-1.5 1.5M19.4 19.4l-1.5-1.5M6.1 6.1L4.6 4.6" />
      </g>
    </Svg>
  );
}

// 月(塗りの三日月。大きい円から右上を欠けさせた形)
export function IconMoon(p) {
  return (
    <Svg {...p}>
      <path d="M14.15 3.26A9 9 0 1 0 20.08 15.97A8 8 0 0 1 14.15 3.26Z" />
    </Svg>
  );
}

/* ---------- 状態 ---------- */

// ○ どちらでもOK(日本語の○×に合わせて、丸だけの形にしています。
//                 小さく表示しても潰れないよう、中にチェックは入れません)
export function IconCheck(p) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="2.9" />
    </Svg>
  );
}

// ✕ 入れない
export function IconX(p) {
  return (
    <Svg {...p}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

// 鍵(閉)= 固定中
export function IconLock(p) {
  return (
    <Svg {...p}>
      <path d="M8 10.2V7a4 4 0 0 1 8 0v3.2" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" />
      <rect x="4.6" y="9.8" width="14.8" height="11.4" rx="2.6" />
    </Svg>
  );
}

// 鍵(開)= 固定しない
export function IconUnlock(p) {
  return (
    <Svg {...p}>
      <path d="M8 10.2V7a4 4 0 0 1 7.7-1.5" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" />
      <rect x="4.6" y="9.8" width="14.8" height="11.4" rx="2.6" />
    </Svg>
  );
}

/* ---------- 操作 ---------- */

// 更新(ぐるっと回る矢印)
export function IconRefresh(p) {
  return (
    <Svg {...p}>
      <path d="M13.94 4.76A7.5 7.5 0 1 1 6.7 6.7" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" />
      <path d="M9.67 3.73L8.89 8.89L4.51 4.51Z" />
    </Svg>
  );
}

// 自動割当(きらめき)
export function IconSparkle(p) {
  return (
    <Svg {...p}>
      <path d="M10 2q1.2 6.8 8 8-6.8 1.2-8 8-1.2-6.8-8-8 6.8-1.2 8-8z" />
      <path d="M18.5 14.6q.5 2.9 3.4 3.4-2.9.5-3.4 3.4-.5-2.9-3.4-3.4 2.9-.5 3.4-3.4z" />
    </Svg>
  );
}

// 閉じる
export function IconClose(p) {
  return (
    <Svg {...p}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevronRight(p) {
  return (
    <Svg {...p}>
      <path d="M9.5 5l7 7-7 7" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronDown(p) {
  return (
    <Svg {...p}>
      <path d="M5 9.5l7 7 7-7" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowLeft(p) {
  return (
    <Svg {...p}>
      <path d="M10.5 5l-7 7 7 7M3.8 12h16.4" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowRight(p) {
  return (
    <Svg {...p}>
      <path d="M13.5 5l7 7-7 7M20.2 12H3.8" fill="none" stroke="currentColor"
        strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ゴミ箱(削除)
export function IconTrash(p) {
  return (
    <Svg {...p}>
      <path d="M4 6.5h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.5 3.5h5a1 1 0 0 1 1 1v2h-7v-2a1 1 0 0 1 1-1z" />
      <path d="M6.2 8.5h11.6l-.9 11.3a2 2 0 0 1-2 1.85H9.1a2 2 0 0 1-2-1.85L6.2 8.5z" />
    </Svg>
  );
}

// カレンダー(ヘッダーのロゴ)
export function IconCalendar(p) {
  return (
    <Svg {...p}>
      <rect x="6.4" y="1.6" width="2.4" height="4.4" rx="1.2" />
      <rect x="15.2" y="1.6" width="2.4" height="4.4" rx="1.2" />
      <path d="M2.5 8.6h19V18a3.5 3.5 0 0 1-3.5 3.5H6A3.5 3.5 0 0 1 2.5 18V8.6z" />
      <path d="M6 3.6h12A3.5 3.5 0 0 1 21.5 7.1H2.5A3.5 3.5 0 0 1 6 3.6z" />
    </Svg>
  );
}

/* ---------- まとめ ---------- */

export const SLOT_NAME = { early: '早番', late: '遅番' };

// 枠に応じたアイコンを出す。<SlotIcon slot="early" />
export function SlotIcon({ slot, ...rest }) {
  return slot === 'early' ? <IconSun {...rest} /> : <IconMoon {...rest} />;
}
