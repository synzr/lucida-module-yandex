import { APIAlbum, APIPlaylist, APITrack } from './api.js'

export interface YandexOptions {
  token: string
  customUserAgent?: string
  useMTSProxy?: boolean
  forceDeprecatedAPI?: boolean
  deprecatedAPIFallback?: boolean
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

export interface AlbumWithTracks {
  album: APIAlbum
  tracks: APITrack[]
}

export interface PlaylistWithTracks {
  playlist: APIPlaylist
  tracks: APITrack[]
}
