import { StreamerAccount } from 'lucida/types'
import { API_URLS, HEADERS } from './constants.js'

import { BadServerResponseError, YandexError } from './errors.js'
import {
  YandexAccountStatusResponse,
  YandexAlbum,
  YandexArtist,
  YandexDownloadInfo,
  YandexErrorObject,
  YandexPlaylist,
  YandexSearchResult,
  YandexTrack
} from './interfaces.js'

import { randomUUID } from 'node:crypto'
import { format } from 'node:util'
import { generateStreamSignature } from './security.js'

export default class YandexClient {
  constructor(private readonly oauthToken: string) {}

  private createHeaders(requestId: string): Headers {
    const headers = new Headers()

    headers.set('User-Agent', HEADERS.USER_AGENT)
    headers.set('Authorization', format(HEADERS.AUTHORIZATION, this.oauthToken))
    headers.set('Origin', HEADERS.ORIGIN)

    headers.set('X-Request-Id', requestId)
    headers.set('X-Yandex-Music-Client', HEADERS.X_YANDEX_MUSIC_CLIENT)
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

    if (response.status >= 200 && response.status < 300) {
      throw new BadServerResponseError(
        'Non-OK HTTP status code provided.',
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
      const errorObject = responseData as YandexErrorObject
      throw YandexError.createFromObject(errorObject)
    }

    return responseData
  }

  async getAccountStatus(): Promise<StreamerAccount> {
    const {
      account: { child: isChildrenOwnedAccount },
      plus: { hasPlus: premium }
    } = await this.request<YandexAccountStatusResponse>(API_URLS.ACCOUNT_STATUS)

    return {
      valid: true,
      explicit: !isChildrenOwnedAccount,
      premium
    }
  }

  async getArtist(artistId: number): Promise<YandexArtist> {
    const url = API_URLS.ARTIST_WITH_BRIEF_INFO({ artistId })

    const { artist } = await this.request<{
      artist: YandexArtist
    }>(url)

    return artist
  }

  async getAlbum(albumId: number): Promise<YandexAlbum> {
    const url = API_URLS.ALBUM({ albumId })
    return await this.request<YandexAlbum>(url)
  }

  async getTracks(trackIds: number[]): Promise<YandexTrack[]> {
    const url = API_URLS.TRACKS({ trackIds })
    return await this.request<YandexTrack[]>(url)
  }

  async getPlaylist(
    userId: string,
    playlistKind: number
  ): Promise<YandexPlaylist> {
    return await this.request<YandexPlaylist>(
      API_URLS.PLAYLIST({ userId, playlistKind })
    )
  }

  async instantSearch(
    query: string,
    limit: number
  ): Promise<YandexSearchResult[]> {
    const { results } = await this.request<{
      results: YandexSearchResult[]
    }>(
      API_URLS.INSTANT_SEARCH_MIXED({
        query,
        types: ['album', 'artist', 'track'],
        page: 0,
        pageSize: limit
      })
    )

    return results
  }

  async getFileInfo(
    trackId: number,
    quality: string,
    codecs: string[],
    transports: string[]
  ): Promise<YandexDownloadInfo> {
    const signature = generateStreamSignature(
      trackId,
      quality,
      codecs,
      transports
    )

    try {
      const { downloadInfo } = await this.request<{
        downloadInfo: YandexDownloadInfo
      }>(
        API_URLS.GET_FILE_INFO({
          ...signature,
          trackId,
          quality,
          codecs,
          transports
        })
      )

      return downloadInfo
    } catch (error: any) {
      if (error.message === 'Invalid Sign') {
        throw new Error('Invalid sign; REPORT THIS TO MAINTAINERS')
      }

      throw error
    }
  }
}
