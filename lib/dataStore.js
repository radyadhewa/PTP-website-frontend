import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'app-data.json');

const defaultData = {
  users: [],
  sessions: {},
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

async function writeStore(data) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

export async function findUserByEmail(email) {
  const store = await readStore();
  return store.users.find((user) => user.email === email) || null;
}

export async function createUser(user) {
  const store = await readStore();
  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function updateUser(email, updater) {
  const store = await readStore();
  const index = store.users.findIndex((user) => user.email === email);

  if (index === -1) {
    return null;
  }

  const nextUser = updater(store.users[index]);
  store.users[index] = nextUser;
  await writeStore(store);
  return nextUser;
}

export async function createSession(token, email) {
  const store = await readStore();
  store.sessions[token] = {
    email,
    createdAt: new Date().toISOString(),
  };
  await writeStore(store);
}

export async function getSession(token) {
  const store = await readStore();
  return store.sessions[token] || null;
}

export async function deleteSession(token) {
  const store = await readStore();
  delete store.sessions[token];
  await writeStore(store);
}