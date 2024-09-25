export const BASE_API_URL = 'https://api.music.yandex.net/'

export const API_URL_ACCOUNT_STATUS = new URL('/account/status', BASE_API_URL)

export const API_URL_ALBUM = new URL('/albums/%d/', BASE_API_URL)
export const API_URL_TRACKS = new URL('/tracks?trackIds=trackIds', BASE_API_URL)
export const API_URL_PLAYLIST = new URL('/users/%s/playlists/%d', BASE_API_URL)
export const API_URL_ARTIST = new URL('/artists/%d/brief-info', BASE_API_URL)

export const API_URL_INSTANT_SEARCH_MIXED = new URL(
  '/search/instant/mixed?text=text&type=type&page=page&pageSize=pageSize',
  BASE_API_URL
)
export const API_URL_GET_FILE_INFO = new URL(
  '/get-file-info?ts=ts&trackId=trackId&quality=quality&codecs=codecs&transports=transports&sign=sign',
  BASE_API_URL
)
