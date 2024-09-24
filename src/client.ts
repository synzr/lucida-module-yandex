import { StreamerAccount } from 'lucida/types'
import { API_URLS, HEADERS } from './constants.js'

import { YandexError } from './errors.js'
import {
  YandexAccountStatusResponse,
  YandexAlbum,
  YandexArtist,
  YandexErrorObject,
  YandexPlaylist,
  YandexSearchResults,
  YandexTrack
} from './interfaces.js'

import { randomUUID } from 'node:crypto'
import { format } from 'node:util'

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

    return await fetch(url, {
      headers: this.createHeaders(requestId)
    })
      .then(function onSuccess(response) {
        if (response.headers.get('X-Request-Id') !== requestId) {
          throw new Error("Bad server response; X-Request-Id doesn't match.")
        }

        return response.json()
      })
      .then(
        function onSuccess(response: Object) {
          if (
            Object.hasOwn(response, 'name') &&
            Object.hasOwn(response, 'message')
          ) {
            throw YandexError.createFromObject(
              response as YandexErrorObject
            )
          }

          return response as T
        },
        function onError(error) {
          throw new Error(
            'Bad server response; Response is not JSON',
            { cause: error }
          )
        }
      )
      .catch(
        function onError(error) {
          throw error
        }
      )
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

    const result = await this.request<{
      artist: YandexArtist
    }>(url)

    return result.artist
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
  ): Promise<YandexSearchResults> {
    return await this.request<YandexSearchResults>(
      API_URLS.INSTANT_SEARCH_MIXED({
        query,
        types: ['album', 'artist', 'track'],
        page: 0,
        pageSize: limit
      })
    )
  }
}
