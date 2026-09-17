import { dbFirst, dbRun, newId, now, type DB } from "../utils";

export interface UserRow {
  id: string;
  email: string;
  email_verified: number; // SQLite boolean
  password_hash: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  mfa_enabled: number;
  mfa_secret: string | null;
}

export async function findUserByEmail(db: DB, email: string): Promise<UserRow | null> {
  return dbFirst<UserRow>(db, "SELECT * FROM users WHERE email = ?", email);
}

export async function findUserById(db: DB, id: string): Promise<UserRow | null> {
  return dbFirst<UserRow>(db, "SELECT * FROM users WHERE id = ?", id);
}

export async function createUser(
  db: DB,
  params: {
    email: string;
    passwordHash: string;
    role: string;
  }
): Promise<UserRow> {
  const id = newId();
  const ts = now();
  await dbRun(
    db,
    `INSERT INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at)
     VALUES (?, ?, 0, ?, ?, 'active', ?, ?)`,
    id,
    params.email,
    params.passwordHash,
    params.role,
    ts,
    ts
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await findUserById(db, id))!;
}

export async function updateUserLastLogin(db: DB, userId: string): Promise<void> {
  await dbRun(
    db,
    "UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?",
    now(),
    now(),
    userId
  );
}

export async function markEmailVerified(db: DB, userId: string): Promise<void> {
  await dbRun(
    db,
    "UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?",
    now(),
    userId
  );
}

export async function updateUserStatus(
  db: DB,
  userId: string,
  status: string
): Promise<void> {
  await dbRun(
    db,
    "UPDATE users SET status = ?, updated_at = ? WHERE id = ?",
    status,
    now(),
    userId
  );
}

export async function updatePasswordHash(
  db: DB,
  userId: string,
  passwordHash: string
): Promise<void> {
  await dbRun(
    db,
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    passwordHash,
    now(),
    userId
  );
}

// Email verification tokens
export interface EmailVerificationTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
}

export async function createEmailVerificationToken(
  db: DB,
  userId: string,
  tokenHash: string,
  expiresAt: string
): Promise<void> {
  await dbRun(
    db,
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    newId(),
    userId,
    tokenHash,
    expiresAt
  );
}

export async function findEmailVerificationToken(
  db: DB,
  tokenHash: string
): Promise<EmailVerificationTokenRow | null> {
  return dbFirst<EmailVerificationTokenRow>(
    db,
    "SELECT * FROM email_verification_tokens WHERE token_hash = ? AND used_at IS NULL",
    tokenHash
  );
}

export async function consumeEmailVerificationToken(db: DB, id: string): Promise<void> {
  await dbRun(
    db,
    "UPDATE email_verification_tokens SET used_at = ? WHERE id = ?",
    now(),
    id
  );
}

// Password reset tokens
export async function createPasswordResetToken(
  db: DB,
  userId: string,
  tokenHash: string,
  expiresAt: string
): Promise<void> {
  // Invalidate previous tokens
  await dbRun(
    db,
    "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
    now(),
    userId
  );
  await dbRun(
    db,
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    newId(),
    userId,
    tokenHash,
    expiresAt
  );
}

export async function findPasswordResetToken(
  db: DB,
  tokenHash: string
): Promise<{ id: string; user_id: string; expires_at: string } | null> {
  return dbFirst(
    db,
    `SELECT id, user_id, expires_at FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL`,
    tokenHash
  );
}

export async function consumePasswordResetToken(db: DB, id: string): Promise<void> {
  await dbRun(
    db,
    "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
    now(),
    id
  );
}
