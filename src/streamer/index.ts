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
import { StreamDownloadResult, YandexOptions } from '../interfaces/internal.js'
import {
  APIAlbumSearchResult,
  APIArtistSearchResult,
  APIDownloadInfo,
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

import { deprecated_getDirectLink } from './_deprecated_storage.js'

import { Readable } from 'node:stream'
import { BadSignatureError } from '../errors.js'

export class Yandex implements Streamer {
  private readonly client: APIClient
  private readonly useMTSProxy: boolean
  private readonly forceDeprecatedAPI: boolean
  private readonly deprecatedAPIFallback: boolean

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
    this.client = new APIClient(
      options.token,
      options.customUserAgent,
      options.useMTSProxy
    )

    this.useMTSProxy = options.useMTSProxy ?? false
    this.forceDeprecatedAPI = options.forceDeprecatedAPI ?? false
    this.deprecatedAPIFallback = options.deprecatedAPIFallback ?? true
  }

  async search(query: string, limit: number): Promise<SearchResults> {
    return this.client
      .instantSearch(query, limit)
      .then(function onSuccess(searchResults): SearchResults {
        const searchGroups =
          searchResults.length > 0
            ? Object.groupBy(
                searchResults,
                function groupCallback(searchResult) {
                  return searchResult.type
                }
              )
            : {} // NOTE: no search results = empty object

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

  private async getDownloadInfoUsingDeprecatedAPI(
    track: APITrack
  ): Promise<StreamDownloadResult> {
    const downloadInfos = await this.client.deprecated_getDownloadInfo(
      +track.id
    )

    const downloadInfo = downloadInfos
      .sort(function sortByBitrate(a, b) {
        return b.bitrateInKbps - a.bitrateInKbps
      })
      .shift()

    const directLink = await deprecated_getDirectLink(
      downloadInfo!.downloadInfoUrl,
      this.useMTSProxy
    )

    return {
      codec: downloadInfo!.codec,
      urls: [directLink]
    }
  }

  private async getDownloadInfo(
    track: APITrack
  ): Promise<StreamDownloadResult> {
    if (this.forceDeprecatedAPI) {
      return await this.getDownloadInfoUsingDeprecatedAPI(track)
    }

    try {
      const fileInfo = await this.client.getFileInfo(
        +track.id,
        'lossless',
        ['mp3', 'aac', 'flac'],
        ['raw']
      )
      return { codec: fileInfo.codec, urls: fileInfo.urls }
    } catch (error: any) {
      const isBadSignatureError = error instanceof BadSignatureError

      if (this.deprecatedAPIFallback || isBadSignatureError) {
        return await this.getDownloadInfoUsingDeprecatedAPI(track)
      }

      throw error
    }
  }

  private getStream(track: APITrack): () => Promise<GetStreamResponse> {
    return async (): Promise<GetStreamResponse> => {
      const { codec, urls } = await this.getDownloadInfo(track)

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
        const { album, tracks } = await this.client.getAlbumWithTracks(
          +pathname.split('/').pop()!
        )
        const trackObjects = tracks.map(createTrackObject)

        return {
          type,
          metadata:
            type === 'podcast'
              ? (createAlbumObject(album) as Podcast)
              : (createAlbumObject(album) as Album),
          ...(type === 'podcast'
            ? { episodes: trackObjects as Episode[] }
            : { tracks: trackObjects })
        } as AlbumGetByUrlResponse | PodcastGetByUrlResponse
      }
      case 'playlist': {
        const [, userId, , playlistKind] = pathname.substring(1).split('/')
        const { playlist, tracks } = await this.client.getPlaylistWithTracks(
          userId,
          +playlistKind
        )

        return {
          type: 'playlist',
          metadata: createPlaylistObject(playlist),
          tracks: tracks.map(createTrackObject)
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

    const id = +pathname.split('/').pop()!

    if (pathname.includes('/track/')) {
      const track = await this.client.getTrack(id)
      return track.albums.pop()!.metaType === 'music' ? 'track' : 'episode'
    }

    const album = await this.client.getAlbum(id)
    return album.metaType === 'music' ? 'album' : 'podcast'
  }

  async getAccountInfo(): Promise<StreamerAccount> {
    const accountStatus = await this.client.getAccountStatus()

    return {
      valid: true,
      country: REGIONS.get(accountStatus?.account?.region ?? 0) ?? 'XX',
      premium: accountStatus?.plus?.hasPlus ?? false,
      explicit: !accountStatus?.account?.child
    }
  }
}
