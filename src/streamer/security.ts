import { SigningRequestResult } from '../interfaces/internal.js'
import { KEY_STREAM_SIGNATURE } from '../constants/keys.js'
import crypto from 'node:crypto'

export function generateStreamSignature(
  trackId: number,
  quality: string,
  codecs: string[],
  transports: string[]
): SigningRequestResult {
  const timestamp = Math.floor(Date.now() / 1000)

  const message = `${timestamp}${trackId}${quality}${codecs.join('')}${transports.join('')}`
  const signature = crypto
    .createHmac('sha256', KEY_STREAM_SIGNATURE)
    .update(message)
    .digest('base64')

  return {
    signature: signature.substring(0, signature.length - 1),
    raw: { message, key: KEY_STREAM_SIGNATURE },
    timestamp
  }
}
