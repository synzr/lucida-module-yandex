export interface YandexOptions {
  oauthToken: string
  customUserAgent?: string
  useMTSProxy?: boolean
  forceDeprecatedDownloadInfoAPI?: boolean
}

export interface SigningRequestResult {
  timestamp: number
  signature: string
  raw: { message: string; key: string }
}

export interface StreamDownloadResult {
  codec: string
  urls: string[]
}
