import {
  Album,
  AlbumGetByUrlResponse,
  ArtistGetByUrlResponse,
  Episode,
  EpisodeGetByUrlResponse,
  GetByUrlResponse,
  GetStreamResponse,
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
  YandexTrack,
  YandexTrackSearchResult
} from './interfaces.js'
import {
  convertToAlbumObject,
  convertToArtistObject,
  convertToPlaylistObject,
  convertToTrackObject
} from './converters.js'

import { Readable } from 'node:stream'

export class YandexStreamer implements Streamer {
  private readonly client: YandexClient

  hostnames = ['music.yandex.ru', 'music.yandex.com']

  constructor(options: YandexStreamerOptions) {
    this.client = new YandexClient(options.oauthToken)
  }

  async search(query: string, limit: number): Promise<SearchResults> {
    return this.client
      .instantSearch(query, limit)
      .then(function onSuccess(searchResults): SearchResults {
        const searchGroups = Object.groupBy(
          searchResults,
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

  private getStream(track: YandexTrack): () => Promise<GetStreamResponse> {
    return async (): Promise<GetStreamResponse> => {
      const { codec, urls } = await this.client.getFileInfo(
        +track.id,
        'lossless',
        ['mp3', 'aac', 'flac'],
        ['raw']
      )

      const streamUrl = urls.shift()!
      const streamResponse = await fetch(streamUrl)

      // NOTE: strm CDN always respond with "audio/mpeg"
      //       for no reason
      let mimeType: string
      switch (codec) {
        case 'aac':
          mimeType = 'audio/aac'
          break
        case 'mp3':
          mimeType = 'audio/mpeg'
          break
        case 'flac':
          mimeType = 'audio/flac'
          break
      }

      return {
        mimeType,
        // @ts-expect-error
        stream: Readable.fromWeb(streamResponse.body!),
        sizeBytes: parseInt(streamResponse.headers.get('content-length')!, 10)
      }
    }
  }

  async getByUrl(url: string): Promise<GetByUrlResponse> {
    const { pathname } = new URL(url)
    const type = await this.getTypeFromUrl(url)

    switch (type) {
      case 'artist': {
        const artist = await this.client.getArtist(+pathname.split('/').pop()!)

        return {
          type: 'artist',
          metadata: convertToArtistObject(artist)
        } as ArtistGetByUrlResponse
      }
      case 'track':
      case 'episode': {
        const tracks = await this.client.getTracks([
          +pathname.split('/').pop()!
        ])
        const track = tracks.pop()!

        return {
          type,
          metadata:
            type === 'episode'
              ? (convertToTrackObject(track) as Episode)
              : (convertToTrackObject(track) as Track),
          getStream: this.getStream(track)
        } as EpisodeGetByUrlResponse | TrackGetByUrlResponse
      }
      case 'album':
      case 'podcast': {
        const album = await this.client.getAlbum(+pathname.split('/').pop()!)

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

    if (pathname.includes('/track/')) {
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
