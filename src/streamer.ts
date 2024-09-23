import {
  GetByUrlResponse,
  ItemType,
  SearchResults,
  Streamer,
  StreamerAccount
} from 'lucida/types'

import YandexClient from './client.js'
import { YandexStreamerOptions } from './interfaces.js'

export class YandexStreamer implements Streamer {
  private readonly client: YandexClient

  hostnames = ['music.yandex.ru', 'music.yandex.com']

  constructor(options: YandexStreamerOptions) {
    this.client = new YandexClient(options.oauthToken)
  }

  async search(query: string, limit: number): Promise<SearchResults> {
    throw new Error('Method not implemented.')
  }

  async getByUrl(url: string): Promise<GetByUrlResponse> {
    throw new Error('Method not implemented.')
  }

  async getTypeFromUrl(url: string): Promise<ItemType> {
    throw new Error('Method not implemented.')
  }

  async getAccountInfo(): Promise<StreamerAccount> {
    return await this.client.getAccountStatus()
  }
}
