import { Album, Artist, CoverArtwork, Playlist, Track } from 'lucida/types'
import {
  YandexAlbum,
  YandexArtist,
  YandexLabel,
  YandexPlaylist,
  YandexTrack
} from './interfaces.js'

const AVAILABLE_COVER_SIZES = [
  '50x50',
  '100x100',
  '200x200',
  '400x400',
  '1000x1000'
]

export function convertToArtistObject(artist: YandexArtist): Artist {
  return {
    id: artist.id,
    url: `https://music.yandex.ru/artist/${artist.id}`,
    name: artist.name,
    pictures: artist.cover
      ? [`https://${artist.cover.uri.replace('%%', 'orig')}`]
      : []
  }
}

export function coverUriToObjects(coverUri: string): CoverArtwork[] {
  return AVAILABLE_COVER_SIZES.map(function createCoverArtworkObject(
    size: string
  ): CoverArtwork {
    const [width, height] = size.split('x').map(Number)
    return { url: `https://${coverUri.replace('%%', size)}`, width, height }
  })
}

export function convertToAlbumObject(album: YandexAlbum): Album {
  return {
    title: album.title,
    id: album.id,
    url: `https://music.yandex.ru/album/${album.id}`,
    trackCount: album.trackCount,
    releaseDate: new Date(album.releaseDate),
    coverArtwork: album.coverUri ? coverUriToObjects(album.coverUri) : [],
    label: album.labels
      ? album.labels
          .map(function getLabelName(label: YandexLabel): string {
            return label.name
          })
          .join()
      : undefined,
    genre: album.genre ? [album.genre] : []
  }
}

export function convertToTrackObject(track: YandexTrack): Track {
  const album = track.albums.shift()!

  return {
    title: track.title,
    id: track.id,
    url: `https://music.yandex.ru/album/${album.id}/track/${track.id}`,
    explicit: track.contentWarning === 'explicit',
    copyright: track.major.name,
    artists: track.artists.map(convertToArtistObject),
    album: convertToAlbumObject(album),
    durationMs: track.durationMs,
    coverArtwork: track.coverUri ? coverUriToObjects(track.coverUri) : [],
    releaseDate: new Date(album.releaseDate)
  }
}

export function convertToPlaylistObject(playlist: YandexPlaylist): Playlist {
  return {
    id: playlist.kind,
    title: playlist.title,
    url: `https://music.yandex.ru/users/${playlist.owner.login}/playlists/${playlist.kind}`,
    coverArtwork:
      playlist.cover.type === 'mosaic'
        ? coverUriToObjects(playlist.cover.itemsUrl!.shift()!)
        : coverUriToObjects(playlist.cover.uri!),
    trackCount: playlist.trackCount
  }
}