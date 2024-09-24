import { YandexSigningRequestResult } from './interfaces.js'
import { KEYS } from './constants.js'

// TODO(synzr): move this to Node APIs
//              EXPLAINATION: this code is ported
//                            from modern desktop client
export async function generateStreamSignature(
  trackId: number,
  quality: string,
  codecs: string[],
  transports: string[]
): Promise<YandexSigningRequestResult> {
  const timestamp = Math.floor(Date.now() / 1000)

  const message = Buffer.from(
    `${timestamp}${trackId}${quality}${codecs.join('')}${transports.join('')}`,
    'utf-8'
  )

  const signature = await crypto.subtle
    .importKey(
      'raw',
      Buffer.from(KEYS.STREAM_SIGNATURE, 'utf-8'),
      {
        name: 'HMAC',
        hash: { name: 'SHA-256' }
      },
      true,
      ['sign', 'verify']
    )
    .then(
      function onSuccess(key) {
        return crypto.subtle.sign('HMAC', key, message)
      },
      function onError(error) {
        throw new Error('Bad signature key; REPORT THIS TO MAINTAINERS', {
          cause: error
        })
      }
    )
    .then(
      function onSuccess(signature): string {
        const signatureB64 = btoa(
          String.fromCharCode(...new Uint8Array(signature))
        )

        return signatureB64.substring(0, signatureB64.length - 1)
      },
      function onError(error) {
        throw new Error("Can't create signature; REPORT THIS TO MAINTAINERS", {
          cause: error
        })
      }
    )

  return { signature, timestamp }
}
