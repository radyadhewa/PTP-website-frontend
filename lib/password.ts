import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';

const SCRYPT_PREFIX = 'scrypt';
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const SALT_LENGTH = 16;
const LEGACY_SHA256_PATTERN = /^[a-f\d]{64}$/i;

interface PasswordVerification {
  valid: boolean;
  needsUpgrade: boolean;
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt);
  return [
    SCRYPT_PREFIX,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString('hex'),
    derivedKey.toString('hex'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<PasswordVerification> {
  const parts = storedHash.split('$');

  if (parts.length === 6 && parts[0] === SCRYPT_PREFIX) {
    const [cost, blockSize, parallelization] = parts.slice(1, 4).map(Number);
    const saltHex = parts[4];
    const hashHex = parts[5];

    if (
      cost !== SCRYPT_COST ||
      blockSize !== SCRYPT_BLOCK_SIZE ||
      parallelization !== SCRYPT_PARALLELIZATION ||
      !/^[a-f\d]{32}$/i.test(saltHex) ||
      !/^[a-f\d]{128}$/i.test(hashHex)
    ) {
      return { valid: false, needsUpgrade: false };
    }

    const expected = Buffer.from(hashHex, 'hex');
    const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'));
    return {
      valid: timingSafeEqual(actual, expected),
      needsUpgrade: false,
    };
  }

  if (LEGACY_SHA256_PATTERN.test(storedHash)) {
    const actual = createHash('sha256').update(password).digest();
    const expected = Buffer.from(storedHash, 'hex');
    const valid = timingSafeEqual(actual, expected);
    return { valid, needsUpgrade: valid };
  }

  return { valid: false, needsUpgrade: false };
}
