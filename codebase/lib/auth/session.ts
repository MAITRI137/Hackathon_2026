import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '../db';
import { SessionUser, RoleSlug } from './types';

const SESSION_COOKIE_NAME = 'transitops_session';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Generates a random session token.
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a session token for secure database storage.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new session for a user and sets the HTTP-only cookie.
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Retrieves the current session user from the cookie token.
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const session = await db.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = session.user;

  if (user.status !== 'ACTIVE') {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleSlug: user.role.slug as RoleSlug,
    status: user.status as 'ACTIVE' | 'DISABLED',
    permissions: user.role.permissions.map((rp: any) => ({
      action: rp.permission.action,
      subject: rp.permission.subject,
    })),
  };
}

/**
 * Destroys the current session and clears the cookie.
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    try {
      await db.session.delete({
        where: { tokenHash },
      });
    } catch (e) {
      // Ignore if session already deleted or doesn't exist
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
