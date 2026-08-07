import type { Request } from "express";
import { USER_STATUS } from "@/modules/account/user.constants";
import { type IUserSession, type IUser } from "@/models/schema";
import { generateSessionToken } from "@/lib/auth/token";
import { getClientIp, getUserAgent } from "@/utils/clientInfo";
import { getDeviceUid } from "@/utils/authCookie";
import { setCache, getCache, deleteCache } from "@/lib/cache";
import {
  insertSession,
  findSessionByToken,
  updateSessionExpiry,
  deleteSessionByToken,
  findSessionTokensByUser,
  deleteSessionsByUser,
} from "@/models/user-session.repository";
import { findUserById } from "@/models/user.repository";

const SESSION_TTL = 300;
const USER_TTL = 300;
const UPDATE_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function sessionCacheKey(token: string) {
  return `auth:session:${token}`;
}

function userCacheKey(id: string) {
  return `auth:user:${id}`;
}

export interface SessionWithUser {
  session: IUserSession;
  user: IUser;
}

export async function issueSession(
  req: Request,
  userId: string,
  options: { remember?: boolean } = {},
): Promise<{ token: string; session: IUserSession }> {
  const remember = !!options.remember;
  const ttlDays = remember ? 30 : 1;
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  const session = await insertSession({
    token,
    user_id: userId,
    expires_at: expiresAt,
    created_at: now,
    updated_at: now,
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
    device_uid: getDeviceUid(req),
    remember,
  });

  await setCache(sessionCacheKey(token), JSON.stringify(session), SESSION_TTL);

  return { token, session };
}

export async function validateSession(
  token: string,
): Promise<SessionWithUser | null> {
  let session: IUserSession | null = null;

  const cachedSession = await getCache(sessionCacheKey(token));
  if (cachedSession) {
    session = JSON.parse(cachedSession) as IUserSession;
  } else {
    const row = await findSessionByToken(token);
    if (!row) return null;
    session = row;
    await setCache(
      sessionCacheKey(token),
      JSON.stringify(session),
      SESSION_TTL,
    );
  }

  if (new Date(session.expires_at) < new Date()) {
    await revokeSession(token);
    return null;
  }

  // Sliding refresh: bump expires_at if updated_at > UPDATE_AGE_MS ago,
  // preserving the session's original lifetime (30d remember / 1d otherwise).
  const updatedAt = new Date(session.updated_at).getTime();
  if (Date.now() - updatedAt > UPDATE_AGE_MS) {
    const ttlDays = session.remember ? 30 : 1;
    const newExpiry = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    await updateSessionExpiry(session.id, newExpiry, now);
    session.expires_at = newExpiry;
    session.updated_at = now;
    await setCache(
      sessionCacheKey(token),
      JSON.stringify(session),
      SESSION_TTL,
    );
  }

  let user: IUser | null = null;
  const cachedUser = await getCache(userCacheKey(session.user_id));
  if (cachedUser) {
    user = JSON.parse(cachedUser) as IUser;
  } else {
    const row = await findUserById(session.user_id);
    if (!row) return null;
    user = row;
    await setCache(userCacheKey(user.id), JSON.stringify(user), USER_TTL);
  }

  if (user.status !== USER_STATUS.ACTIVE) return null;

  return { session, user };
}

export async function revokeSession(token: string): Promise<void> {
  await deleteSessionByToken(token);
  await deleteCache(sessionCacheKey(token));
}

export async function revokeUserSessions(userId: string): Promise<void> {
  const rows = await findSessionTokensByUser(userId);

  if (rows.length > 0) {
    await deleteSessionsByUser(userId);
    await Promise.all(rows.map((r) => deleteCache(sessionCacheKey(r.token))));
  }
  await deleteCache(userCacheKey(userId));
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await deleteCache(userCacheKey(userId));
}

export async function invalidateSessionCache(token: string): Promise<void> {
  await deleteCache(sessionCacheKey(token));
}
