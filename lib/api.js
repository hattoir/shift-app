// GET は必ず最新を取りに行く(ブラウザ・CDNのキャッシュを使わない)
export async function getJson(url) {
  try {
    // URLの末尾に時刻を付けて、途中のキャッシュに当たらないようにする
    const bust = (url.includes('?') ? '&' : '?') + '_=' + Date.now();
    const res = await fetch(url + bust, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: data?.error || `通信エラー (${res.status})` };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: 'ネットワークに接続できません' };
  }
}

export async function postJson(url, body, method = 'POST') {
  try {
    const res = await fetch(url, {
      method,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: data?.error || `通信エラー (${res.status})` };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: 'ネットワークに接続できません' };
  }
}
