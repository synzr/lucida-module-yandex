import { format } from 'util'
import {
  WEB_URL_ALBUM,
  WEB_URL_ARTIST,
  WEB_URL_PLAYLIST,
  WEB_URL_TRACK
} from '../../constants/urls/web.js'

export function createAlbumWebUrl(albumId: number): URL {
  return new URL(format(WEB_URL_ALBUM.pathname, albumId), WEB_URL_ALBUM.origin)
}

export function createTrackWebUrl(albumId: number, trackId: number): URL {
  return new URL(
    format(WEB_URL_TRACK.pathname, albumId, trackId),
    WEB_URL_TRACK.origin
  )
}

export function createPlaylistWebUrl(
  userId: string,
  playlistKind: number
): URL {
  return new URL(
    format(WEB_URL_PLAYLIST.pathname, userId, playlistKind),
    WEB_URL_PLAYLIST.origin
  )
}

export function createArtistWebUrl(artistId: number): URL {
  return new URL(
    format(WEB_URL_ARTIST.pathname, artistId),
    WEB_URL_ARTIST.origin
  )
}
