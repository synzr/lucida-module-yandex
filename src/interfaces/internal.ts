export interface YandexOptions {
  oauthToken: string
  customUserAgent?: string
  useMTSProxy?: boolean
}

export interface SigningRequestResult {
  timestamp: number
  signature: string
  raw: { message: string; key: string }
}
