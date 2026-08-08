import { NextResponse } from 'next/server';

// APIの返事が Vercel/CDN/ブラウザにキャッシュされて「古い内容が表示される」のを防ぐ。
// 使い方は NextResponse.json と同じ(Cookie も res.cookies.set で付けられる)。
export function json(body, init) {
  const res = NextResponse.json(body, init);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('CDN-Cache-Control', 'no-store');
  res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  res.headers.set('Pragma', 'no-cache');
  return res;
}
