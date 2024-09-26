import { XMLParser } from 'fast-xml-parser'
import { BadServerResponseError } from '../errors.js'
import { deprecated_StorageDownloadInfo } from '../interfaces/_deprecated_storage.js'
import { deprecated_generateStreamSignature } from './security.js'

export async function deprecated_getDirectLink(
  sourceUrl: string,
  useMTSProxy: boolean = false
): Promise<string> {
  if (useMTSProxy) {
    sourceUrl = sourceUrl.replace(
      'https://storage.mds.yandex.net/',
      'https://music.mts.ru/ya_download/'
    )
  }

  const response = await fetch(sourceUrl)

  if (response.status === 410) {
    throw new BadServerResponseError(
      'Storage server responds with 410 Gone. Try to get stream again!',
      response
    )
  }

  const { 'download-info': downloadInfo } = new XMLParser().parse(
    await response.text()
  ) as deprecated_StorageDownloadInfo

  const signingRequest = deprecated_generateStreamSignature(
    downloadInfo.path,
    downloadInfo.s
  )

  return new URL(
    `/get-mp3/${signingRequest.signature}/${downloadInfo.ts}${downloadInfo.path}`,
    `https://${downloadInfo.host}`
  ).toString()
}
