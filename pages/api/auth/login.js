import crypto from 'crypto';
import { createSession, findUserByEmail } from '@/lib/dataStore';

const normalizeEmail = (email) => email.trim().toLowerCase();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email || '');

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = crypto.randomUUID();
  await createSession(token, normalizedEmail);

  res.setHeader('Set-Cookie', `reading_session=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return res.status(200).json({ email: normalizedEmail });
}