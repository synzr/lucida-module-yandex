# lucida-module-yandex

[Yandex.Music](https://music.yandex.ru) support for [Lucida downloader library](https://git.gay/lucida/lucida).

Everything _(including playlist and search functionality)_ is implemented.

### Installation

```bash
# npm
npm install lucida-module-yandex

# pnpm
pnpm add lucida-module-yandex
```

### Usage example

```js
import Lucida from "lucida";
import Yandex from "./dist/index.js"

const lucida = new Lucida({
  modules: {
    yandex: new Yandex({
      // the OAuth token (need for streamer to work)
      oauthToken: 'y0_0000000000000000000000000000000000000000000000000000000'
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
  console.log('Поэзия (Track) - ПОЛЮСА:', track.metadata.durationMs / 1000, 'second duration')

  const streamResponse = await track.getStream()
  console.log('Track mime type:' streamResponse.mimeType)
  console.log('Track size in bytes:', streamResponse.sizeBytes)

  const playlist = await lucida.getByUrl('https://music.yandex.ru/users/yearbyyear/playlists/1235')
  console.log('International 2010s Pop Music (Playlist):', playlist.metadata.trackCount, 'track(s)')
}

void main()
```
