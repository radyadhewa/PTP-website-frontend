import crypto from 'crypto';
import { createUser, createSession, findUserByEmail } from '@/lib/dataStore';

const normalizeEmail = (email) => email.trim().toLowerCase();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function buildDefaultProfile(email, password) {
  return {
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    preferences: null,
    readingData: {
      currentStreak: 0,
      bestStreak: 0,
      totalBooksRead: 0,
      lastReadDate: null,
    },
    writingDraft: {
      introduction: '',
      body: '',
      conclusion: '',
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { email, password, confirmPassword } = req.body || {};
  const normalizedEmail = normalizeEmail(email || '');

  if (!normalizedEmail || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email, password, and confirmation are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const user = buildDefaultProfile(normalizedEmail, password);
  await createUser(user);

  const token = crypto.randomUUID();
  await createSession(token, normalizedEmail);

  res.setHeader('Set-Cookie', `reading_session=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return res.status(201).json({ email: normalizedEmail });
}