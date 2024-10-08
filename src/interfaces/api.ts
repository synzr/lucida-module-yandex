export interface APIErrorObject {
  name: string
  message: string
}

export interface APIAccountStatusResponse {
  account: { region?: number; child?: boolean }
  plus?: { hasPlus: boolean }
}

export interface APIArtist {
  id: string | number
  name: string
  cover?: { uri: string } | null
  available?: boolean
}

export interface APILabel {
  id: number
  name: string
}

export type APIVolume = Array<{ id: number }>

export interface APIAlbum {
  id: number
  title: string
  type: 'music' | 'podcast' | 'albumbook'
  metaType?: 'music' | 'podcast' | 'albumbook'
  releaseDate: string
  coverUri: string
  trackCount: number
  artists: APIArtist[]
  labels: APILabel[]
  volumes?: APIVolume[]
  available: boolean
  genre?: string
  error?: 'no-rights' | 'not-found'
}

export interface APITrack {
  id: string
  title: string
  version?: string
  major: { id: number; name: string }
  disclaimers: string[]
  available: boolean
  coverUri?: string
  artists: APIArtist[]
  albums: APIAlbum[]
  durationMs: number
}

export interface APITrackDisclaimer {
  modal?: {
    reason: 'legal' | string
    title: string
    description: string
  }
}

export interface APIPlaylistTrack {
  id: number
  originalIndex: number
}

export interface APIPlaylist {
  kind: number
  title: string
  cover: {
    type: 'pic' | 'mosaic'
    itemsUri?: string[]
    uri?: string
  }
  owner: { login: string }
  trackCount: number
  tracks: APIPlaylistTrack[]
}

export interface APIAlbumSearchResult {
  type: 'album'
  album: APIAlbum
}

export interface APIArtistSearchResult {
  type: 'artist'
  artist: APIArtist
}

export interface APITrackSearchResult {
  type: 'track'
  track: APITrack
}

export type APISearchResult =
  | APIAlbumSearchResult
  | APIArtistSearchResult
  | APITrackSearchResult

export interface APIDownloadInfo {
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

export interface deprecated_APIDownloadInfo {
  codec: 'aac' | 'mp3'
  gain: boolean
  preview: boolean
  downloadInfoUrl: string
  direct: false
  bitrateInKbps: number
}
