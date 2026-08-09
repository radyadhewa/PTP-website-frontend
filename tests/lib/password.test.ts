import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing', () => {
  it('hashes passwords with scrypt and verifies only the original password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[a-f\d]{32}\$[a-f\d]{128}$/i);
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toEqual({
      valid: true,
      needsUpgrade: false,
    });
    await expect(verifyPassword('incorrect password', hash)).resolves.toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });

  it('accepts a valid legacy SHA-256 hash and marks it for upgrade', async () => {
    const legacyHash = createHash('sha256').update('legacy secret').digest('hex');

    await expect(verifyPassword('legacy secret', legacyHash)).resolves.toEqual({
      valid: true,
      needsUpgrade: true,
    });
    await expect(verifyPassword('wrong secret', legacyHash)).resolves.toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });

  it('rejects malformed and unsupported stored hashes without throwing', async () => {
    await expect(verifyPassword('secret', 'scrypt$16384$8$1$bad$hash')).resolves.toEqual({
      valid: false,
      needsUpgrade: false,
    });
    await expect(verifyPassword('secret', 'not-a-password-hash')).resolves.toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });
});
