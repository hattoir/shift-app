import crypto from 'crypto';
import { cookies } from 'next/headers';

export function adminToken() {
  return crypto.createHash('sha256').update('shift-app:' + process.env.ADMIN_PASSWORD).digest('hex');
}

export function isAdmin() {
  const c = cookies().get('admin_token');
  return c && c.value === adminToken();
}
