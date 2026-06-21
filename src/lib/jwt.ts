import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'local-dev-jwt-secret-change-in-production'
)
const COOKIE = 'workbuddy_session'
const TTL    = 60 * 60 * 24 * 7 // 7 days

export async function signSessionJwt(
  payload: { sub: string; email?: string; platform?: string; nonce?: string },
  ttlSeconds = TTL,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(SECRET)
}

export async function verifySessionJwt(token: string): Promise<{ sub: string; email: string; platform?: string; nonce?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { sub: string; email: string; platform?: string; nonce?: string }
  } catch {
    return null
  }
}

export const SESSION_COOKIE = COOKIE
export const SESSION_TTL    = TTL
