import {
  BadServerResponseError,
  BadSignatureError,
  SmartCaptchaError,
  APIError,
  RoskomnadzorError
} from '../errors.js'
import {
  APIAccountStatusResponse,
  APIAlbum,
  APIArtist,
  APIDownloadInfo,
  APIErrorObject,
  APIPlaylist,
  APISearchResult,
  APITrack,
  APITrackDisclaimer,
  deprecated_APIDownloadInfo
} from '../interfaces/api.js'
import { AlbumWithTracks, PlaylistWithTracks } from '../interfaces/internal.js'

import {
  createAccountStatusUrl,
  createAlbumAPIUrl,
  createArtistAPIUrl,
  createFileInfoAPIUrl,
  createInstantSearchMixedAPIUrl,
  createPlaylistAPIUrl,
  createTrackDisclaimerAPIUrl,
  createTracksAPIUrl,
  deprecated_createDownloadInfoAPIUrl
} from '../factories/urls/api.js'

import {
  HEADER_AUTHORIZATION,
  HEADER_ORIGIN,
  HEADER_USER_AGENT,
  HEADER_X_YANDEX_MUSIC_CLIENT
} from '../constants/headers.js'

import { generateStreamSignature } from './security.js'

import { randomUUID } from 'node:crypto'
import { format } from 'node:util'

export default class APIClient {
  constructor(
    private readonly oauthToken: string,
    private readonly userAgent?: string,
    private readonly useMTSProxy?: boolean
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

    if (response.status < 200 && response.status < 300) {
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

  async getAccountStatus(): Promise<APIAccountStatusResponse> {
    return await this.request<APIAccountStatusResponse>(
      createAccountStatusUrl(this.useMTSProxy)
    )
  }

  async getArtist(artistId: number): Promise<APIArtist> {
    const url = createArtistAPIUrl(artistId, this.useMTSProxy)

    const { artist } = await this.request<{
      artist: APIArtist
    }>(url)

    return artist
  }

  async getAlbum(albumId: number): Promise<APIAlbum> {
    const url = createAlbumAPIUrl(albumId, this.useMTSProxy)
    return await this.request<APIAlbum>(url)
  }

  async getAlbumWithTracks(albumId: number): Promise<AlbumWithTracks> {
    const album = await this.getAlbum(albumId)
    const tracks = await this.getTracks(
      album.volumes!.flat().map(({ id }) => id)
    )

    return { album, tracks }
  }

  async getTracks(
    trackIds: number[],
    removeUnavailableTracks: boolean = true
  ): Promise<APITrack[]> {
    const url = createTracksAPIUrl(trackIds, this.useMTSProxy)
    let tracks = await this.request<APITrack[]>(url)

    for (let track in tracks) {
      if (removeUnavailableTracks && !tracks[track].available) {
        tracks = tracks.splice(+track, 1)
      }
    }

    return tracks
  }

  async getTrackDisclaimer(trackId: number): Promise<APITrackDisclaimer> {
    const url = createTrackDisclaimerAPIUrl(trackId)
    return await this.request<APITrackDisclaimer>(url)
  }

  async getTrack(trackId: number): Promise<APITrack> {
    const [track] = await this.getTracks([trackId], false)

    if (track.disclaimers.includes('modal')) {
      const trackDisclaimer = await this.getTrackDisclaimer(trackId)

      if (trackDisclaimer.modal?.reason === 'legal') {
        throw new RoskomnadzorError(
          'This track is banned in Russia by Roskomnadzor.'
        )
      }
    }

    return track
  }

  async getPlaylist(
    userId: string,
    playlistKind: number
  ): Promise<APIPlaylist> {
    return await this.request<APIPlaylist>(
      createPlaylistAPIUrl(userId, playlistKind, this.useMTSProxy)
    )
  }

  async getPlaylistWithTracks(
    userId: string,
    playlistKind: number
  ): Promise<PlaylistWithTracks> {
    const playlist = await this.getPlaylist(userId, playlistKind)
    const tracks = await this.getTracks(playlist.tracks.map(({ id }) => id))

    return { playlist, tracks }
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
        limit,
        this.useMTSProxy
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

  async deprecated_getDownloadInfo(
    trackId: number
  ): Promise<deprecated_APIDownloadInfo[]> {
    return await this.request<deprecated_APIDownloadInfo[]>(
      deprecated_createDownloadInfoAPIUrl(trackId, this.useMTSProxy)
    )
  }
}
