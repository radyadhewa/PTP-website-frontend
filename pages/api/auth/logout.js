import { deleteSession } from '@/lib/dataStore';

function getSessionToken(cookieHeader = '') {
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith('reading_session='));
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const token = getSessionToken(req.headers.cookie);
  if (token) {
    await deleteSession(token);
  }

  res.setHeader('Set-Cookie', 'reading_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return res.status(200).json({ ok: true });
}