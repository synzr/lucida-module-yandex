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
  StreamerTestData,
  Track,
  TrackGetByUrlResponse
} from 'lucida/types'

import APIClient from './client.js'
import { YandexOptions } from '../interfaces/internal.js'
import {
  APIAlbumSearchResult,
  APIArtistSearchResult,
  APITrack,
  APITrackSearchResult
} from '../interfaces/api.js'
import {
  createAlbumObject,
  createArtistObject,
  createPlaylistObject,
  createTrackObject
} from '../factories/objects.js'
import REGIONS from '../constants/regions.js'

import { Readable } from 'node:stream'

export class Yandex implements Streamer {
  private readonly client: APIClient

  hostnames = ['music.yandex.ru', 'music.yandex.com']
  testData: StreamerTestData = {
    'https://music.yandex.ru/album/4072009/track/33307663': {
      title: 'Бета-каротин - Бумбокс (BoomBox)',
      type: 'track'
    },
    'https://music.yandex.ru/album/3879328': {
      title: 'Глубина резкости - Дельфин (Dolphin)',
      type: 'album'
    },
    'https://music.yandex.ru/users/yearbyyear/playlists/1235': {
      title: "International 2010s Pop Music (API.Music editor' playlist)",
      type: 'playlist'
    }
  }

  constructor(options: YandexOptions) {
    this.client = new APIClient(options.oauthToken, options.customUserAgent)
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
              createTrackObject((object as APITrackSearchResult).track)
            ) ?? [],
          albums:
            searchGroups.album?.map((object) =>
              createAlbumObject((object as APIAlbumSearchResult).album)
            ) ?? [],
          artists:
            searchGroups.artist?.map((object) =>
              createArtistObject((object as APIArtistSearchResult).artist)
            ) ?? []
        }
      })
  }

  private getStream(track: APITrack): () => Promise<GetStreamResponse> {
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
      let mimeType = `audio/${codec}`
      if (codec === 'mp3') {
        mimeType = 'audio/mpeg'
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
          metadata: createArtistObject(artist)
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
              ? (createTrackObject(track) as Episode)
              : (createTrackObject(track) as Track),
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
              ? (createAlbumObject(album) as Podcast)
              : (createAlbumObject(album) as Album)
        } as AlbumGetByUrlResponse | PodcastGetByUrlResponse
      }
      case 'playlist': {
        const [, userId, , playlistKind] = pathname.substring(1).split('/')
        const playlist = await this.client.getPlaylist(userId, +playlistKind)

        return {
          type: 'playlist',
          metadata: createPlaylistObject(playlist)
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
      const accountStatus = await this.client.getAccountStatus()

      return {
        valid: true,
        country: REGIONS.get(accountStatus.account.region!) ?? 'XX',
        premium: accountStatus.plus?.hasPlus ?? false,
        explicit: !accountStatus.account.child
      }
    } catch {
      return { valid: false }
    }
  }
}
