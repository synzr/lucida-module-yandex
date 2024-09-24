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

export type YandexSearchResults = {
  results: YandexSearchResult[]
}
