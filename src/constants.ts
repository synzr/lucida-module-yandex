export const HEADERS = {
  USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'YandexMusic/5.18.2 Chrome/122.0.6261.156 Electron/29.4.6 Safari/537.36',
  X_YANDEX_MUSIC_CLIENT: 'YandexMusicDesktopAppWindows/5.18.2',
  AUTHORIZATION: 'OAuth %s',
  ORIGIN: 'music-application://desktop'
}

export const API_URLS = {
  ACCOUNT_STATUS: new URL('https://api.music.yandex.net/account/status'),
  PLAYLIST({
    userId,
    playlistKind
  }: {
    userId: string
    playlistKind: number
  }): URL {
    return new URL(
      `/users/${userId}/playlists/${playlistKind}`,
      'https://api.music.yandex.net/'
    )
  },
  ALBUM({ albumId }: { albumId: number }): URL {
    return new URL(`/albums/${albumId}/`, 'https://api.music.yandex.net/')
  },
  TRACKS({ trackIds: $trackIds }: { trackIds: number[] }): URL {
    const trackIds = $trackIds.map((trackId) => trackId.toString()).join(',')
    return new URL(
      `/tracks?trackIds=${trackIds}`,
      'https://api.music.yandex.net/'
    )
  },
  INSTANT_SEARCH_MIXED({
    query,
    types,
    page,
    pageSize
  }: {
    query: string
    types: string[]
    page: number
    pageSize: number
  }): URL {
    query = encodeURIComponent(query)
    const typesValue = encodeURIComponent(types.join(','))

    return new URL(
      `/search/instant/mixed?text=${query}&type=${typesValue}&page=${page}&pageSize=${pageSize}`,
      'https://api.music.yandex.net/'
    )
  },
  ARTIST_WITH_BRIEF_INFO({ artistId }: { artistId: number }): URL {
    return new URL(
      `/artists/${artistId}/brief-info`,
      'https://api.music.yandex.net/'
    )
  },
  GET_FILE_INFO({
    signature,
    timestamp,
    trackId,
    quality,
    codecs,
    transports
  }: {
    signature: string
    timestamp: number
    trackId: number
    quality: string
    codecs: string[]
    transports: string[]
  }) {
    signature = encodeURIComponent(signature)
    quality = encodeURIComponent(quality)

    const codecsValue = encodeURIComponent(codecs.join(','))
    const transportsValue = encodeURIComponent(transports.join(','))

    return new URL(
      `/get-file-info?ts=${timestamp}&trackId=${trackId}&quality=${quality}&codecs=${codecsValue}&transports=${transportsValue}&sign=${signature}`,
      'https://api.music.yandex.net/'
    )
  }
}

export const KEYS = {
  STREAM_SIGNATURE: 'kzqU4XhfCaY6B6JTHODeq5'
}
