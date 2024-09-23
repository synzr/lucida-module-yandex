import { StreamerAccount } from 'lucida/types'
import { API_URLS, HEADERS } from './constants.js'

import { YandexError } from './errors.js'
import {
  YandexAccountStatusResponse,
  YandexErrorResponse
} from './interfaces.js'

import { randomUUID } from 'node:crypto'
import { format } from 'node:util'

export default class YandexClient {
  constructor(private readonly oauthToken: string) {}

  private createHeaders(requestId: string): Headers {
    const headers = new Headers()

    headers.set('User-Agent', HEADERS.USER_AGENT)
    headers.set('Authorization', format(HEADERS.AUTHORIZATION, this.oauthToken))

    headers.set('X-Request-Id', requestId)
    headers.set('X-Yandex-Music-Client', HEADERS.X_YANDEX_MUSIC_CLIENT)
    headers.set('X-Yandex-Music-Frontend', 'new')

    // NOTE: no useless invocation info in the server response
    headers.set('X-Yandex-Music-Without-Invocation-Info', '1')

    return headers
  }

  private async request<T>(url: URL): Promise<T> {
    const requestId = randomUUID()

    return fetch(url, {
      headers: this.createHeaders(requestId)
    })
      .then(function onSuccess(response) {
        if (response.headers.get('X-Request-Id') !== requestId) {
          throw new Error("Bad server response; X-Request-Id doesn't match.")
        }

        return response.json()
      })
      .then(
        function onSuccess(response: Object) {
          if (Object.hasOwn(response, 'error')) {
            throw YandexError.createFromObject(
              (response as YandexErrorResponse).error
            )
          }

          return response as T
        },
        function onError(error) {
          throw new Error('Bad server response; Response is not JSON', {
            cause: error
          })
        }
      )
  }

  // TODO(synzr): check if response.result.account.hostedUser
  //              means that account is children-owned
  //              SEE: https://yandex.ru/support/id/ru/family/children.html
  async getAccountStatus(): Promise<StreamerAccount> {
    const {
      result: {
        account: { region: country, hostedUser: isChildrenOwnedAccount },
        plus: { hasPlus: premium }
      }
    } = await this.request<YandexAccountStatusResponse>(
      API_URLS.ACCOUNT_SUCCESS
    )

    return {
      valid: true,
      explicit: !isChildrenOwnedAccount,
      premium,
      country
    }
  }
}
