import { format } from 'util'
import {
  API_URL_ALBUM,
  API_URL_ARTIST,
  API_URL_GET_FILE_INFO,
  API_URL_INSTANT_SEARCH_MIXED,
  API_URL_PLAYLIST,
  API_URL_TRACKS
} from '../constants/api.js'
import { SigningRequestResult } from '../interfaces/internal.js'

export function createAlbumAPIUrl(albumId: number): URL {
  return new URL(format(API_URL_ALBUM.pathname, albumId), API_URL_ALBUM.origin)
}

export function createTracksAPIUrl(trackIds: number[]): URL {
  const url = new URL(API_URL_TRACKS)
  url.searchParams.set('trackIds', trackIds.join(','))

  return url
}

export function createPlaylistAPIUrl(
  userId: string,
  playlistKind: number
): URL {
  return new URL(
    format(API_URL_PLAYLIST.pathname, userId, playlistKind),
    API_URL_PLAYLIST.origin
  )
}

export function createArtistAPIUrl(artistId: number): URL {
  return new URL(
    format(API_URL_ARTIST.pathname, artistId),
    API_URL_ARTIST.origin
  )
}

export function createInstantSearchMixedAPIUrl(
  text: string,
  types: string[],
  page: number = 0,
  pageSize: number = 25
): URL {
  const url = new URL(API_URL_INSTANT_SEARCH_MIXED)

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
  transports: string[]
): URL {
  const url = new URL(API_URL_GET_FILE_INFO)

  url.searchParams.set('ts', signingRequest.timestamp.toString())
  url.searchParams.set('trackId', trackId.toString())
  url.searchParams.set('quality', quality)
  url.searchParams.set('codecs', codecs.join(','))
  url.searchParams.set('transports', transports.join(','))
  url.searchParams.set('sign', signingRequest.signature)

  return url
}
