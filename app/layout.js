import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'シフト管理', description: '早番・遅番シフト管理アプリ' };

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <header className="header">
          <Link href="/" className="brand">📅 シフト管理</Link>
          <nav>
            <Link href="/">シフト表</Link>
            <Link href="/availability">希望日入力</Link>
            <Link href="/admin">管理者</Link>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
