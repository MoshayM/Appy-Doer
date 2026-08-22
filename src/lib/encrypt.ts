import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) return Buffer.alloc(32) // dev fallback
  return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
  const iv  = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`
}

export function decrypt(encoded: string): string {
  const [ivB64, tagB64, encB64] = encoded.split('.')
  const iv  = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const enc = Buffer.from(encB64, 'base64')
  const decipher = createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
