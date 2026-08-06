export async function getJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
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
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: data?.error || `通信エラー (${res.status})` };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: 'ネットワークに接続できません' };
  }
}
