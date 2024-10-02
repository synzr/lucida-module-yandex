# **THIS LIBRARY IS MOVED TO [GIT.GAY](https://git.gay/synzr-lucida/lucida-module-yandex)**

**THIS REPOSITORY IS DEPRECATED AND ARCHIVED!**

# lucida-module-yandex

[![Lint](https://github.com/synzr/lucida-module-yandex/actions/workflows/lint.yaml/badge.svg?branch=main)](https://github.com/synzr/lucida-module-yandex/actions/workflows/lint.yaml) [![Versioning](https://github.com/synzr/lucida-module-yandex/actions/workflows/versioning.yaml/badge.svg?branch=main)](https://github.com/synzr/lucida-module-yandex/actions/workflows/versioning.yaml) [![Release](https://github.com/synzr/lucida-module-yandex/actions/workflows/release.yaml/badge.svg?branch=main)](https://github.com/synzr/lucida-module-yandex/actions/workflows/release.yaml)

[Yandex.Music](https://music.yandex.ru) module for [Lucida downloader library](https://git.gay/lucida/lucida).

### Installation

```bash
# npm
npm install lucida-module-yandex

# pnpm
pnpm add lucida-module-yandex
```

### Roadmap

- [x] Account status fetch implementation
- [x] Instant search for `lucida.search()`
- [x] Metadata fetcher implementation
- [x] Working `getStream()` implementation
- [x] Basic codebase refactoring
- [x] CI/CD via GitHub Actions
- [x] Optional [MTS Music](https://music.mts.ru) API proxy
- [x] Deprecated API as fallback after bad signature error
- [ ] Lyrics downloader
- [ ] Documentation of modern "download info" API

### Usage example

```js
import Lucida from 'lucida'
import Yandex from 'lucida-module-yandex'

const lucida = new Lucida({
  modules: {
    yandex: new Yandex({
      // the OAuth token (required)
      token: 'y0_0000000000000000000000000000000000000000000000000000000',
      // custom user agent (optional; can be used to bypass SmartCaptcha)
      customUserAgent: 'curl/8.10.1',
      // use MTS Music API proxy for API requests (optional; can be used to bypass SmartCaptcha)
      useMTSProxy: false,
      // force to use the deprecated API to download the audio (optional)
      forceDeprecatedAPI: false,
      // the deprecated API fallback (optional, enable by default)
      deprecatedAPIFallback: true,
      // the HTTP proxy URL (optional; can be used to bypass SmartCaptcha)
      proxyUrl: 'http://user:pass@localhost:8080'
    })
  }
})

async function main() {
  const { yandex: yandexAccount } = await lucida.checkAccounts()
  console.log('Yandex account status:', yandexAccount)

  const boomboxSearch = await lucida.search('бумбокс', 10)
  console.log('Бумбокс (Artist):', boomboxSearch.yandex.artists.shift().url)

  const album = await lucida.getByUrl('https://music.yandex.ru/album/1111940')
  console.log('Поэзия (Album) - ПОЛЮСА:', album.metadata.trackCount, 'track(s)')

  const track = await lucida.getByUrl(
    'https://music.yandex.ru/album/1111940/track/32656060'
  )
  console.log(
    'Поэзия (Track) - ПОЛЮСА:',
    track.metadata.durationMs / 1000,
    'second(s)'
  )

  const streamResponse = await track.getStream()
  console.log('Track mime type:', streamResponse.mimeType)
  console.log('Track size in bytes:', streamResponse.sizeBytes)

  const playlist = await lucida.getByUrl(
    'https://music.yandex.ru/users/yearbyyear/playlists/1235'
  )
  console.log(
    'International 2010s Pop Music (Playlist):',
    playlist.metadata.trackCount,
    'track(s)'
  )
}

void main()
```
