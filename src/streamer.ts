import {
  Album,
  AlbumGetByUrlResponse,
  ArtistGetByUrlResponse,
  Episode,
  EpisodeGetByUrlResponse,
  GetByUrlResponse,
  ItemType,
  PlaylistGetByUrlResponse,
  Podcast,
  PodcastGetByUrlResponse,
  SearchResults,
  Streamer,
  StreamerAccount,
  Track,
  TrackGetByUrlResponse
} from 'lucida/types'

import YandexClient from './client.js'
import {
  YandexAlbumSearchResult,
  YandexArtistSearchResult,
  YandexStreamerOptions,
  YandexTrackSearchResult
} from './interfaces.js'
import {
  convertToAlbumObject,
  convertToArtistObject,
  convertToPlaylistObject,
  convertToTrackObject
} from './converters.js'

export class YandexStreamer implements Streamer {
  private readonly client: YandexClient

  hostnames = ['music.yandex.ru', 'music.yandex.com']

  constructor(options: YandexStreamerOptions) {
    this.client = new YandexClient(options.oauthToken)
  }

  async search(query: string, limit: number): Promise<SearchResults> {
    return this.client
      .instantSearch(query, limit)
      .then(function onSuccess(search): SearchResults {
        const searchGroups = Object.groupBy(
          search.results,
          function groupCallback(searchResult) {
            return searchResult.type
          }
        )

        return {
          query,
          tracks:
            searchGroups.track?.map((object) =>
              convertToTrackObject((object as YandexTrackSearchResult).track)
            ) ?? [],
          albums:
            searchGroups.album?.map((object) =>
              convertToAlbumObject((object as YandexAlbumSearchResult).album)
            ) ?? [],
          artists:
            searchGroups.artist?.map((object) =>
              convertToArtistObject((object as YandexArtistSearchResult).artist)
            ) ?? []
        }
      })
  }

  async getByUrl(url: string): Promise<GetByUrlResponse> {
    const { pathname } = new URL(url)
    const type = await this.getTypeFromUrl(url)

    switch (type) {
      case 'artist': {
        const artist = await this.client.getArtist(
          +pathname.split('/').pop()!
        )

        return {
          type: 'artist',
          metadata: convertToArtistObject(artist)
        } as ArtistGetByUrlResponse
      }
      case 'track':
      case 'episode': {
        const track = await this.client.getTracks([
          +pathname.split('/').pop()!
        ])

        return {
          type,
          metadata:
            type === 'episode'
              ? (convertToTrackObject(track.pop()!) as Episode)
              : (convertToTrackObject(track.pop()!) as Track)
        } as EpisodeGetByUrlResponse | TrackGetByUrlResponse
      }
      case 'album':
      case 'podcast': {
        const album = await this.client.getAlbum(
          +pathname.split('/').pop()!
        )

        return {
          type,
          metadata:
            type === 'podcast'
              ? (convertToAlbumObject(album) as Podcast)
              : (convertToAlbumObject(album) as Album)
        } as AlbumGetByUrlResponse | PodcastGetByUrlResponse
      }
      case 'playlist': {
        const [, userId, , playlistKind] = pathname.substring(1).split('/')
        const playlist = await this.client.getPlaylist(userId, +playlistKind)

        return {
          type: 'playlist',
          metadata: convertToPlaylistObject(playlist)
        } as PlaylistGetByUrlResponse
      }
    }
  }

  async getTypeFromUrl(url: string): Promise<ItemType> {
    const { pathname } = new URL(url)

    if (pathname.startsWith('/users/') && pathname.includes('/playlists/')) {
      return 'playlist'
    }

    if (pathname.startsWith('/artist/')) {
      return 'artist'
    }

    if (pathname.includes('/tracks/')) {
      const tracks = await this.client.getTracks([+url.split('/').pop()!])

      return tracks.pop()!.albums.pop()!.metaType === 'music'
        ? 'track'
        : 'episode'
    }

    const album = await this.client.getAlbum(+url.split('/').pop()!)
    return album.type === 'music' ? 'album' : 'podcast'
  }

  async getAccountInfo(): Promise<StreamerAccount> {
    try {
      return await this.client.getAccountStatus()
    } catch {
      return { valid: false }
    }
  }
}
