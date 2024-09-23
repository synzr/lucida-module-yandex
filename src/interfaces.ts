export interface YandexStreamerOptions {
  oauthToken: string
}

export interface YandexErrorObject {
  name: string
  message: string
}

export interface YandexErrorResponse {
  error: YandexErrorObject
}

// NOTE: interface with pure minimal for the implementation needs
export interface YandexAccountStatusResponse {
  result: {
    account: { region: string; hostedUser: boolean }
    plus: { hasPlus: boolean }
  }
}
