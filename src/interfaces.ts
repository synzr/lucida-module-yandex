export interface YandexStreamerOptions {
  oauthToken: string
  customUserAgent?: string
}

export interface YandexErrorObject {
  name: string
  message: string
}

// NOTE: interfaces with pure minimal for the implementation needs
export interface YandexAccountStatusResponse {
  account: { child: boolean }
  plus: { hasPlus: boolean }
}

export interface YandexArtist {
  id: string | number
  name: string
  cover?: { uri: string } | null
  available?: boolean
}

export interface YandexLabel {
  id: number
  name: string
}

export interface YandexAlbum {
  id: number
  title: string
  type: 'music' | 'podcast' | 'albumbook'
  metaType?: 'music' | 'podcast' | 'albumbook'
  releaseDate: string
  coverUri: string
  trackCount: number
  artists: YandexArtist[]
  labels: YandexLabel[]
  available: boolean
  genre?: string
}

export interface YandexTrack {
  id: string
  title: string
  major: { id: number; name: string }
  contentWarning?: 'explicit'
  coverUri?: string
  artists: YandexArtist[]
  albums: YandexAlbum[]
  available: boolean
  durationMs: number
}

export interface YandexPlaylist {
  kind: number
  title: string
  cover: {
    type: 'pic' | 'mosaic'
    itemsUrl?: string[]
    uri?: string
  }
  owner: { login: string }
  trackCount: number
}

export interface YandexAlbumSearchResult {
  type: 'album'
  album: YandexAlbum
}

export interface YandexArtistSearchResult {
  type: 'artist'
  artist: YandexArtist
}

export interface YandexTrackSearchResult {
  type: 'track'
  track: YandexTrack
}

export type YandexSearchResult =
  | YandexAlbumSearchResult
  | YandexArtistSearchResult
  | YandexTrackSearchResult

export interface YandexSigningRequestResult {
  timestamp: number
  signature: string
  raw: { message: string; key: string }
}

export interface YandexDownloadInfo {
  trackId: string
  quality: string
  codec: 'mp3' | 'aac' | 'flac'
  bitrate: number
  transport: 'raw'
  size: number
  urls: string[]
  url: string
  realId: string
}
