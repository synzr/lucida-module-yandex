# lucida-module-yandex

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
- [ ] Optional [MTS Music](https://music.mts.ru) API proxy
- [ ] CI/CD via GitHub Actions
- [ ] Outdated "download info" API as fallback after bad signature error
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
      oauthToken: 'y0_0000000000000000000000000000000000000000000000000000000',
      // custom user agent (optional; can be used to bypass SmartCaptcha)
      customUserAgent: 'curl/8.10.1'
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

  const track = await lucida.getByUrl('https://music.yandex.ru/album/1111940/track/32656060')
  console.log('Поэзия (Track) - ПОЛЮСА:', track.metadata.durationMs / 1000, 'second(s)')

  const streamResponse = await track.getStream()
  console.log('Track mime type:' streamResponse.mimeType)
  console.log('Track size in bytes:', streamResponse.sizeBytes)

  const playlist = await lucida.getByUrl('https://music.yandex.ru/users/yearbyyear/playlists/1235')
  console.log('International 2010s Pop Music (Playlist):', playlist.metadata.trackCount, 'track(s)')
}

void main()
```
