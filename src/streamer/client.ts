import { StreamerAccount } from 'lucida/types'
import {
  HEADER_AUTHORIZATION,
  HEADER_ORIGIN,
  HEADER_USER_AGENT,
  HEADER_X_YANDEX_MUSIC_CLIENT
} from '../constants/headers.js'

import {
  BadServerResponseError,
  BadSignatureError,
  SmartCaptchaError,
  APIError
} from '../errors.js'
import {
  APIAccountStatusResponse,
  APIAlbum,
  APIArtist,
  APIDownloadInfo,
  APIErrorObject,
  APIPlaylist,
  APISearchResult,
  APITrack
} from '../interfaces/api.js'

import {
  createAlbumAPIUrl,
  createArtistAPIUrl,
  createFileInfoAPIUrl,
  createInstantSearchMixedAPIUrl,
  createPlaylistAPIUrl,
  createTracksAPIUrl
} from '../converters/urls.js'
import { API_URL_ACCOUNT_STATUS } from '../constants/api.js'

import { randomUUID } from 'node:crypto'
import { format } from 'node:util'
import { generateStreamSignature } from './security.js'

export default class APIClient {
  constructor(
    private readonly oauthToken: string,
    private readonly userAgent?: string
  ) {}

  private createHeaders(requestId: string): Headers {
    const headers = new Headers()

    headers.set('User-Agent', this.userAgent ?? HEADER_USER_AGENT)
    headers.set('Authorization', format(HEADER_AUTHORIZATION, this.oauthToken))
    headers.set('Origin', HEADER_ORIGIN)

    headers.set('X-Request-Id', requestId)
    headers.set('X-Yandex-Music-Client', HEADER_X_YANDEX_MUSIC_CLIENT)
    headers.set('X-Yandex-Music-Frontend', 'new')

    // NOTE: no useless invocation info in the server response
    headers.set('X-Yandex-Music-Without-Invocation-Info', '1')

    return headers
  }

  private async request<T>(url: URL): Promise<T> {
    const requestId = randomUUID()
    const response = await fetch(url, {
      headers: this.createHeaders(requestId)
    })

    if (response.headers.has('X-Yandex-Captcha')) {
      throw new SmartCaptchaError(
        'Server just returned the SmartCaptcha challenge page. :(',
        response
      )
    }

    if (response.status >= 200 && response.status < 300) {
      throw new BadServerResponseError(
        'Bad HTTP status code is provided by server.',
        response
      )
    }

    if (
      !response.headers.has('X-Request-Id') ||
      response.headers.get('X-Request-Id') !== requestId
    ) {
      throw new BadServerResponseError(
        `Request ID (${requestId}) isn't match, nor provided by server.`,
        response
      )
    }

    let responseData: T
    try {
      responseData = (await response.json()) as T
    } catch {
      throw new BadServerResponseError(
        'Failed to parse JSON data from response body',
        response
      )
    }

    if (
      Object.hasOwn(responseData as object, 'error') &&
      Object.hasOwn(responseData as object, 'message')
    ) {
      const errorObject = responseData as APIErrorObject
      throw APIError.createFromObject(errorObject)
    }

    return responseData
  }

  async getAccountStatus(): Promise<StreamerAccount> {
    const {
      account: { child: isChildrenOwnedAccount },
      plus: { hasPlus: premium }
    } = await this.request<APIAccountStatusResponse>(API_URL_ACCOUNT_STATUS)

    return {
      valid: true,
      explicit: !isChildrenOwnedAccount,
      premium
    }
  }

  async getArtist(artistId: number): Promise<APIArtist> {
    const url = createArtistAPIUrl(artistId)

    const { artist } = await this.request<{
      artist: APIArtist
    }>(url)

    return artist
  }

  async getAlbum(albumId: number): Promise<APIAlbum> {
    const url = createAlbumAPIUrl(albumId)
    return await this.request<APIAlbum>(url)
  }

  async getTracks(trackIds: number[]): Promise<APITrack[]> {
    const url = createTracksAPIUrl(trackIds)
    return await this.request<APITrack[]>(url)
  }

  async getPlaylist(
    userId: string,
    playlistKind: number
  ): Promise<APIPlaylist> {
    return await this.request<APIPlaylist>(
      createPlaylistAPIUrl(userId, playlistKind)
    )
  }

  async instantSearch(
    query: string,
    limit: number
  ): Promise<APISearchResult[]> {
    const { results } = await this.request<{
      results: APISearchResult[]
    }>(
      createInstantSearchMixedAPIUrl(
        query,
        ['album', 'artist', 'track'],
        0,
        limit
      )
    )

    return results
  }

  async getFileInfo(
    trackId: number,
    quality: string,
    codecs: string[],
    transports: string[]
  ): Promise<APIDownloadInfo> {
    const signingRequest = generateStreamSignature(
      trackId,
      quality,
      codecs,
      transports
    )

    try {
      const { downloadInfo } = await this.request<{
        downloadInfo: APIDownloadInfo
      }>(
        createFileInfoAPIUrl(
          signingRequest,
          trackId,
          quality,
          codecs,
          transports
        )
      )

      return downloadInfo
    } catch (error: any) {
      if ((error as APIError).message === 'Invalid Sign') {
        throw new BadSignatureError(signingRequest)
      }

      throw error
    }
  }
}
