export const HEADERS = {
  USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'YandexMusic/5.18.2 Chrome/122.0.6261.156 Electron/29.4.6 Safari/537.36',
  X_YANDEX_MUSIC_CLIENT: 'YandexMusicDesktopAppWindows/5.18.2',
  AUTHORIZATION: 'OAuth %s',
  ORIGIN: 'music-application://desktop'
}

export const API_URLS = {
  ACCOUNT_SUCCESS: new URL('https://api.music.yandex.net/account/status')
}
