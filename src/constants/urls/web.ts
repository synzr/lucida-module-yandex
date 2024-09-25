export const BASE_WEB_URL = 'https://music.yandex.ru/'

export const WEB_URL_ARTIST = new URL('/artist/%d', BASE_WEB_URL)
export const WEB_URL_ALBUM = new URL('/album/%d', BASE_WEB_URL)
export const WEB_URL_TRACK = new URL('/album/%d/track/%d', BASE_WEB_URL)
export const WEB_URL_PLAYLIST = new URL('/users/%s/playlists/%d', BASE_WEB_URL)
