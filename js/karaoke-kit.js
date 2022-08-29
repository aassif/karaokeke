import * as media from "./media.js";
//import Renderer from "./renderer.js";
import LyricsXML from "./lyrics-xml.js";

class KaraokeKIT extends EventTarget
{
  constructor ()
  {
    super ();
  }

  load (url)
  {
    return fetch (url).
      then (r => r.arrayBuffer ()).
      then (buffer => {
        let d = new Uint8Array (buffer);

        // Nombre de fichiers.
        let n = d [3];

        // Taille de chaque fichier.
        let index = [];
        for (let i = 0; i < n; ++i)
        {
          let view = new DataView (buffer, 4 + 5*i);
          let id = view.getUint8 (0);
          let length = view.getUint32 (1, false);
          index.push ({id, length});
        }

        // Données de chaque fichier.
        let buffers = {};
        index.forEach (item => {
          buffers [item.id] = new Uint8Array (item.length);
        });

        // Lecture par morceaux.
        let o = 4 + 5*n;
        while (o < d.length)
        {
          let view = new DataView (buffer, o);
          let id = view.getUint8 (0);
          let length = view.getUint32 (1, false);
          let offset = view.getUint32 (5, false);
          //console.log (o + 9, {id, length, offset});
          let chunk = d.subarray (o + 9, o + 9 + length);
          buffers [id].set (chunk, offset);
          o += 9 + length;
        }
        
        // Fichier principal : chanson XML.
        let song = buffers [1];

        // Analyse de la chanson XML.
        let decoder = new TextDecoder ('utf-8');
        let text = decoder.decode (song);
        const parser = new DOMParser ();
        let xml = parser.parseFromString (text, 'application/xml');
        let response = xml.documentElement;

        this.lyrics = new LyricsXML ();
        this.lyrics.parse_karaoke (response.querySelector ('karaoke'));

        let F = selector => response.querySelector (selector).getAttribute ('index');

        let files = response.querySelector ('files');
        let tracks =
        [
          {index: F ('file[label="ins.ogg"]'), volume: 1},
          {index: F ('file[label="bv.ogg"]'), volume: 1}
        ]

        this.tracks = tracks.map (() => document.createElement ('audio'));
        if (tracks.length > 0)
          this.tracks[0].addEventListener ('ended', () => {
            let e = new Event ('ended');
            this.dispatchEvent (e);
          });

        let promises = tracks.map (({index, volume}, k) => media.BLOB (this.tracks[k], new Blob ([buffers [index]]), {volume}));
        return Promise.all (promises);
      });
  }

  play ()
  {
    this.lyrics.play ();
    this.tracks.forEach (t => t.play ());
  }

  stop ()
  {
    this.lyrics.stop ();
    this.tracks.forEach (t => media.DISPOSE (t));
  }
}

export default KaraokeKIT;

