import { format } from 'util'
import {
  API_URL_ACCOUNT_STATUS,
  API_URL_ALBUM,
  API_URL_ARTIST,
  API_URL_GET_FILE_INFO,
  API_URL_INSTANT_SEARCH_MIXED,
  API_URL_PLAYLIST,
  API_URL_TRACKS,
  BASE_API_URL_MTS,
  BASE_API_URL_YANDEX,
  deprecated_API_URL_DOWNLOAD_INFO
} from '../../constants/urls/api.js'
import { SigningRequestResult } from '../../interfaces/internal.js'

function getBaseUrl(useMTSProxy: boolean): string {
  return useMTSProxy ? BASE_API_URL_MTS : BASE_API_URL_YANDEX
}

export function createAccountStatusUrl(useMTSProxy: boolean = false): URL {
  return new URL(API_URL_ACCOUNT_STATUS, getBaseUrl(useMTSProxy))
}

export function createAlbumAPIUrl(
  albumId: number,
  useMTSProxy: boolean = false
): URL {
  return new URL(format(API_URL_ALBUM, albumId), getBaseUrl(useMTSProxy))
}

export function createTracksAPIUrl(
  trackIds: number[],
  useMTSProxy: boolean = false
): URL {
  const url = new URL(API_URL_TRACKS, getBaseUrl(useMTSProxy))
  url.searchParams.set('trackIds', trackIds.join(','))

  return url
}

export function createPlaylistAPIUrl(
  userId: string,
  playlistKind: number,
  useMTSProxy: boolean = false
): URL {
  return new URL(
    format(API_URL_PLAYLIST, userId, playlistKind),
    getBaseUrl(useMTSProxy)
  )
}

export function createArtistAPIUrl(
  artistId: number,
  useMTSProxy: boolean = false
): URL {
  return new URL(format(API_URL_ARTIST, artistId), getBaseUrl(useMTSProxy))
}

export function createInstantSearchMixedAPIUrl(
  text: string,
  types: string[],
  page: number = 0,
  pageSize: number = 25,
  useMTSProxy: boolean = false
): URL {
  const url = new URL(API_URL_INSTANT_SEARCH_MIXED, getBaseUrl(useMTSProxy))

  url.searchParams.set('text', text)
  url.searchParams.set('type', types.join(','))
  url.searchParams.set('page', page.toString())
  url.searchParams.set('pageSize', pageSize.toString())

  return url
}

export function createFileInfoAPIUrl(
  signingRequest: SigningRequestResult,
  trackId: number,
  quality: string,
  codecs: string[],
  transports: string[],
  useMTSProxy: boolean = false
): URL {
  const url = new URL(API_URL_GET_FILE_INFO, getBaseUrl(useMTSProxy))

  url.searchParams.set('ts', signingRequest.timestamp.toString())
  url.searchParams.set('trackId', trackId.toString())
  url.searchParams.set('quality', quality)
  url.searchParams.set('codecs', codecs.join())
  url.searchParams.set('transports', transports.join())
  url.searchParams.set('sign', signingRequest.signature)

  return url
}

export function deprecated_createDownloadInfoAPIUrl(
  trackId: number,
  useMTSProxy: boolean = false
): URL {
  return new URL(
    format(deprecated_API_URL_DOWNLOAD_INFO, trackId),
    getBaseUrl(useMTSProxy)
  )
}
