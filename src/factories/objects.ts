import { Album, Artist, CoverArtwork, Playlist, Track } from 'lucida/types'
import {
  APIAlbum,
  APIArtist,
  APILabel,
  APIPlaylist,
  APITrack
} from '../interfaces/api.js'
import {
  createAlbumWebUrl,
  createArtistWebUrl,
  createPlaylistWebUrl,
  createTrackWebUrl
} from './urls/web.js'

const AVAILABLE_COVER_SIZES = [
  '50x50',
  '100x100',
  '200x200',
  '400x400',
  '1000x1000'
]

export function createArtistObject(artist: APIArtist): Artist {
  return {
    id: artist.id,
    url: createArtistWebUrl(+artist.id).toString(),
    name: artist.name,
    pictures: artist.cover
      ? [`https://${artist.cover.uri.replace('%%', 'orig')}`]
      : []
  }
}

export function createCoverArtworks(uri: string): CoverArtwork[] {
  return AVAILABLE_COVER_SIZES.map(function createCoverArtworkObject(
    size: string
  ): CoverArtwork {
    const [width, height] = size.split('x').map(Number)
    return { url: `https://${uri.replace('%%', size)}`, width, height }
  })
}

export function createAlbumObject(album: APIAlbum): Album {
  return {
    title: album.title,
    id: album.id,
    url: createAlbumWebUrl(album.id).toString(),
    trackCount: album.trackCount,
    releaseDate: new Date(album.releaseDate),
    coverArtwork: album.coverUri ? createCoverArtworks(album.coverUri) : [],
    label: album.labels
      ? album.labels
          .map(function getLabelName(label: APILabel): string {
            return label.name
          })
          .join(', ')
      : undefined,
    genre: album.genre ? [album.genre] : [],
    discCount: album.volumes?.length
  }
}

export function createTrackObject(track: APITrack): Track {
  const album = track.albums.shift()!

  return {
    title: track.title,
    id: track.id,
    url: createTrackWebUrl(album.id, +track.id).toString(),
    explicit: track.disclaimers.includes('explicit'),
    copyright: track.major.name,
    artists: track.artists.map(createArtistObject),
    album: createAlbumObject(album),
    durationMs: track.durationMs,
    coverArtwork: track.coverUri ? createCoverArtworks(track.coverUri) : [],
    releaseDate: new Date(album.releaseDate)
  }
}

export function createPlaylistObject(playlist: APIPlaylist): Playlist {
  return {
    id: playlist.kind,
    title: playlist.title,
    url: createPlaylistWebUrl(playlist.owner.login, playlist.kind).toString(),
    coverArtwork:
      playlist.cover.type === 'mosaic'
        ? createCoverArtworks(playlist.cover.itemsUri!.shift()!)
        : createCoverArtworks(playlist.cover.uri!),
    trackCount: playlist.trackCount
  }
}
