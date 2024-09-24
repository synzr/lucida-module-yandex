import { YandexSigningRequestResult } from './interfaces.js'
import { KEYS } from './constants.js'
import crypto from 'node:crypto'

export function generateStreamSignature(
  trackId: number,
  quality: string,
  codecs: string[],
  transports: string[]
): YandexSigningRequestResult {
  const timestamp = Math.floor(Date.now() / 1000)

  const signature = crypto
    .createHmac('sha256', KEYS.STREAM_SIGNATURE)
    .update(
      `${timestamp}${trackId}${quality}${codecs.join('')}${transports.join('')}`
    )
    .digest('base64')

  return {
    signature: signature.substring(0, signature.length - 1),
    timestamp
  }
}
