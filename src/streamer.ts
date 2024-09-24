import {
  GetByUrlResponse,
  ItemType,
  SearchResults,
  Streamer,
  StreamerAccount
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
        console.log(search)
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
    throw new Error('Method not implemented.')
  }

  async getTypeFromUrl(url: string): Promise<ItemType> {
    throw new Error('Method not implemented.')
  }

  async getAccountInfo(): Promise<StreamerAccount> {
    try {
      return await this.client.getAccountStatus()
    } catch {
      return { valid: false }
    }
  }
}
