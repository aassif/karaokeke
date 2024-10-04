import * as media from "./media.js";
import Renderer   from "./renderer.js";

import decrypt    from "./aes-128-ecb.js";

const TYPE_SONG  = 1;
const TYPE_AUDIO = 2;
const TYPE_IMAGE = 3;
const TYPE_FONT  = 4;
const TYPE_VIDEO = 5;
const TYPE_VIZ   = 6;

function STR (data, encoding = 'utf-8')
{
  let d = new TextDecoder (encoding);
  return d.decode (data);
}

function FOURCC (data, position)
{
  return STR (data.subarray (position, position + 4));
}

function HEADER (d, o)
{
  let id = FOURCC (d, o);
  o += 4;

  let view = new DataView (d.buffer, o);

  let type = view.getUint8 (0);
  ++o;

  switch (type)
  {
    case 1:
    {
      let value = view.getInt32 (1, true);
      o += 4;

      return {id, value, offset: o}
    }

    case 2:
    {
      let length = view.getInt32 (1, true);
      o += 4;

      let value = d.subarray (o, o + length);
      o += length;

      return {id, value, offset: o};
    }

    default:
    {
      console.error (type);
      throw 'kfn_chunk_type';
    }
  }
}

function HEADERS (d)
{
  let signature = FOURCC (d, 0);
  if (signature != 'KFNB') throw 'kfn_signature';

  // En-têtes.
  let headers = {};
  // Position dans le buffer.
  let o = 4;
  for (let h = HEADER (d, o); h.id != 'ENDH'; h = HEADER (d, o), o = h.offset)
    headers [h.id] = h.value;

  return {offset: o, headers};
}

function FILES (d, o)
{
  let view = new DataView (d.buffer);

  let n = view.getInt32 (o, true);
  o += 4;

  let files = [];
  for (let i = 0; i < n; ++i)
  {
    let m = view.getInt32 (o, true);
    o += 4;

    let filename = STR (d.subarray (o, o + m));
    o += m;

    let type    = view.getInt32 (o, true); o += 4;
    let length1 = view.getInt32 (o, true); o += 4;
    let offset  = view.getInt32 (o, true); o += 4;
    let length2 = view.getInt32 (o, true); o += 4;
    let flags   = view.getInt32 (o, true); o += 4;

    files.push ({filename, type, length1, offset, length2, flags});
  }

  return {offset: o, files};
}

function DECRYPT (data, key, length)
{
  return decrypt (key, data).subarray (0, length);
}

function SONG_INI (data)
{
  const COMMENT   = /^;.*$/;
  const SECTION   = /^\[([^\]]*)\]$/;
  const PARAMETER = /^([^=]+)=(.*?)$/;

  let o = {};
  let lines = STR (data).split (/[\r\n]+/);

  let section = null;
  for (let line of lines)
  {
    if (! COMMENT.test (line))
    {
      let s = line.match (SECTION);
      if (s)
      {
        section = s[1].toLowerCase ();
        o[section] = {};
      }

      let p = line.match (PARAMETER);
      if (p)
      {
        let k = p[1].toLowerCase ();
        if (section)
          o[section][k] = p[2];
        else
          o[k] = p[2];
      }
    }
  }

  return o;
}

function SONG_COLORS (effect)
{
  return {
    activecolor: effect.activecolor.slice (0, 7),
    inactivecolor: effect.inactivecolor.slice (0, 7),
    activebordercolor: effect.framecolor.slice (0, 7),
    inactivebordercolor: effect.inactiveframecolor.slice (0, 7)
  };
}

// Valeurs des champs d'un objet filtrés par leur noms de clés.
const FILTER = (o, r) => Object.entries (o).filter (p => r.test (p[0])).map (p => p[1]);

function SONG_LYRICS (effect)
{
  // Texte.
  let T = FILTER (effect, /^text(\d+)$/i).
    map (t => t.split (' ').map (w => w.split ('/')));

  // Synchro.
  let S = FILTER (effect, /^sync(\d+)$/i).
    reduce ((sync, s) => sync.concat (s.split (',')), []);

  // Création d'une syllabe synchronisée.
  let SYLLABLE = (text, k) => ({text, start: S[k]*10, end: S[k+1]*10});

  // Synchronisation des syllabes.
  let {lines} = T.reduce (({lines, k}, l) => {
    let {words, j} = l.reduce (({words, j}, w) => {
      let syllables = w.map ((s, i) => SYLLABLE (s, k+j+i));
      return {words: words.concat ([syllables]), j: j + syllables.length};
    }, {words: [], j: 0});
    return {lines: lines.concat ([words]), k: k + j};
  }, {lines: [], k: 0});

  return lines;
}

function SONG_KARAOKE (lyrics, n, colors)
{
  function SYLLABLE (s)
  {
    let text = s.text.replace (/_/g, ' ');
    return /^(\s*)$/.test (text) ? null : {...s, text};
  }

  function WORD (w)
  {
    return {syllables: w.map (s => SYLLABLE (s)).filter (s => s != null)};
  }

  function LINE (l, y, height)
  {
    let words = l.map (w => WORD (w)).filter (w => w.syllables.length > 0);
    let position = {x: 0, y, width: 640, height};
    return {words, position};
  }

  function PAGE (l1, l2)
  {
    let s = [...l1.words, ...l2.words].
      reduce ((s, w) => s.concat (w.syllables), []);

    if (s.length < 1)
      return {lines: [], opacity: () => 0};

    let t0 = s[0].start, t1 = s.slice (-1) [0].end;

    let animation =
    {
      fadeinstart: t0 - 750,
      fadeinduration: 250,
      fadeoutstart: t1,
      fadeoutduration: 500
    };

    return {lines: [l1, l2], ...animation, ...colors};
  }

  const L = k => k < lyrics.length ? lyrics [k] : [];

  let pages = [];
  for (let i = 0; i < lyrics.length; i += 4)
  {
    let line0 = LINE (L (i+0), 120, 50);
    let line1 = LINE (L (i+1), 180, 50);
    pages.push (PAGE (line0, line1));

    let line2 = LINE (L (i+2), 240, 50);
    let line3 = LINE (L (i+3), 300, 50);
    pages.push (PAGE (line2, line3));
  }

  return {pages, silences: []};
}

function SONG_TRACKS (song)
{
  // Création d'une piste.
  let track = (file, volume) => ({file, volume});

  // Piste instrumentale.
  let source = song.general.source.split (',');
  let t0 = track (source[2], 1);
  console.log (source);

  // Pistes vocales.
  let V = [1, 0.1];
  let T = FILTER (song.mp3music, /^track(\d+)$/).map (t => t.split (','));
  let tracks = T.map ((t, k) => track (t[0], V [k]));

  return [t0, ...tracks];
}

class KaraokeKFN extends EventTarget
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

        // Lecture des en-têtes.
        let {offset: o1, headers} = HEADERS (d);
        console.log (headers);

        // Liste des fichiers.
        let {offset: o2, files} = FILES (d, o1);
        console.log (files);

        // Extraction d'un fichier.
        function FILE (f)
        {
          let data = d.subarray (o2 + f.offset, o2 + f.offset + f.length2);
          return f.flags ? DECRYPT (data, headers.FLID, f.length1) : data;
        }

        // Extraction par nom de fichier.
        let F = filename => FILE (files.find (f => f.filename == filename));

        let song = SONG_INI (F ('Song.ini'));
        console.log (song);

        // Sections.
        //let sections = song.sections.sections.split (',').map (s => s.split (' '));

        // Accords.
        //let chords = song.chords.chords.split (',').map (s => s.length > 0 ? s.split (' ') : undefined);

        // Recherche de l'effet principal.
        let EFF = FILTER (song, /^eff(\d+)$/i);
        let effect = EFF.find (e => parseInt (e.inpractice));
        console.log (effect);

        // Syllabes synchronisées.
        let lyrics = SONG_LYRICS (effect);

        // Mise en page des syllabes.
        let n = parseInt (effect.linecount);
        let colors = SONG_COLORS (effect);
        this.lyrics = new Renderer ();
        this.lyrics.karaoke = SONG_KARAOKE (lyrics, n, colors);
        console.log (this.lyrics.karaoke);

        // Pistes audio.
        let tracks = SONG_TRACKS (song);
        console.log (tracks);

        this.tracks = tracks.map (() => document.createElement ('audio'));
        if (tracks.length > 0)
          this.tracks[0].addEventListener ('ended', () => {
            let e = new Event ('ended');
            this.dispatchEvent (e);
          });

        let promises =
          tracks.map (({file, volume}, k) =>
            media.BLOB (this.tracks[k], new Blob ([F (file)]), {volume}));

        return Promise.all (promises).then (() => this.lyrics.render ());
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

export default KaraokeKFN;

