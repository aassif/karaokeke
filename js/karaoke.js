import Camera        from "./camera.js";
import LyricsCDG     from "./lyrics-cdg.js";
import LyricsXML     from "./lyrics-xml.js";
import VideoChroma   from "./video-chroma.js";
import VideoKaraFun  from "./video-karafun.js";
import VideoSingKing from "./video-singking.js";
import KaraokeKFN    from "./karaoke-kfn.js";
import KaraokeKIT    from "./karaoke-kit.js";
import * as media    from "./media.js";

const DEFAULT_BACKGROUND = 'backgrounds/nyan_cat.webm';
const DEFAULT_CDG_HEIGHT = '50%';

class DrawList
{
  constructor ()
  {
    this.items = [];
    this.request = null;
    this.animate ();
  }

  add (item)
  {
    this.items.push (item);
  }

  remove (item)
  {
    this.items = this.items.filter (x => x !== item);
  }

  animate ()
  {
    this.items.forEach (item => item.draw ());
    this.request = requestAnimationFrame (() => this.animate ());
  }

  stop ()
  {
    cancelAnimationFrame (this.request);
  }
}

class Karaoke extends EventTarget
{
  constructor ()
  {
    super ();
    this.camera = new Camera ();
    this.lyrics = document.getElementById ('lyrics');
    this.background = document.getElementById ('background');
    this.song = {type: null};
    this.items = new DrawList ();
  }

  set_camera (constraints, chroma_key)
  {
    this.camera.init (constraints).then (() => {
      let w = document.getElementById ('camera');

      if (this.chroma)
      {
        w.removeChild (this.chroma.canvas);
        this.items.remove (this.chroma);
      }

      this.camera.video.play ().then (() => {
        this.chroma = new VideoChroma (this.camera.video, chroma_key);
        w.appendChild (this.chroma.canvas);
        let listener = () => this.items.add (this.chroma);
        this.camera.video.addEventListener ('timeupdate', listener, {once: true});
      });
    });
  }

  play_cdg (mp3, cdg, background, offset, height)
  {
    this.song = {
      type: 'mp3+cdg',
      lyrics: new LyricsCDG (),
      audio: document.createElement ('audio')
    };

    let promises =
    [
      this.song.lyrics.load (cdg, height),
      media.LOAD (this.song.audio, mp3),
      media.LOAD (this.background, background, {offset})
    ];

    Promise.all (promises).then (() => {
      this.song.lyrics.play ();
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.items.add (this.song.lyrics);
      this.song.audio.addEventListener ('ended', () => this.stop ());
      this.song.audio.play ();
      media.PLAY (this.background, offset);
    });
  }

  play_karafun_xml (mp4, xml, background, offset)
  {
    this.song = {
      type: 'karafun-xml',
      lyrics: new LyricsXML (),
      audio: document.createElement ('audio')
    };

    let promises =
    [
      this.song.lyrics.load (xml),
      media.LOAD (this.song.audio, mp4),
      media.LOAD (this.background, background, {offset})
    ];

    Promise.all (promises).then (() => {
      this.song.lyrics.play ();
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.items.add (this.song.lyrics);
      this.song.audio.addEventListener ('ended', () => this.stop ());
      this.song.audio.play ();
      media.PLAY (this.background, offset);
    });
  }

  play_karafun_kfn (kfn, background, offset)
  {
    this.song = {
      type: 'karafun-kfn',
      karafun: new KaraokeKFN ()
    };

    let promises =
    [
      this.song.karafun.load (kfn),
      media.LOAD (this.background, background, {offset})
    ];

    Promise.all (promises).then (() => {
      this.song.karafun.play ();
      this.song.karafun.addEventListener ('ended', () => this.stop ())
      this.lyrics.appendChild (this.song.karafun.lyrics.canvas);
      this.items.add (this.song.karafun.lyrics);
      media.PLAY (this.background, offset);
    });
  }

  play_karafun_kit (kit, background, offset)
  {
    this.song = {
      type: 'karafun-kit',
      karafun: new KaraokeKIT ()
    };

    let promises =
    [
      this.song.karafun.load (kit),
      media.LOAD (this.background, background, {offset})
    ];

    Promise.all (promises).then (() => {
      this.song.karafun.play ();
      this.song.karafun.addEventListener ('ended', () => this.stop ())
      this.lyrics.appendChild (this.song.karafun.lyrics.canvas);
      this.items.add (this.song.karafun.lyrics);
      media.PLAY (this.background, offset);
    });
  }

  play_karafun (video, colors, background, offset)
  {
    this.song = {
      type: 'karafun',
      video: document.createElement ('video'),
      lyrics: null
    };

    let promises =
    [
      media.LOAD (this.song.video, video),
      media.LOAD (this.background, background, {offset})
    ];

    Promise.all (promises).then (() => {
      this.song.video.addEventListener ('ended', () => this.stop ());
      this.song.video.play ().then ( () => {
        this.song.lyrics = new VideoKaraFun (this.song.video, colors);
        this.lyrics.appendChild (this.song.lyrics.canvas);
        let listener = () => this.items.add (this.song.lyrics);
        this.song.video.addEventListener ('timeupdate', listener, {once: true});
      });
      media.PLAY (this.background, offset);
    });
  }

  play_singking (video, background, offset)
  {
    this.song = {
      type: 'singking',
      video: document.createElement ('video'),
      lyrics: null
    };

    let promises =
    [
      media.LOAD (this.song.video, video),
      media.LOAD (this.background, background, {offset})
    ];

    Promise.all (promises).then (() => {
      this.song.video.addEventListener ('ended', () => this.stop ());
      this.song.video.play ().then (() => {
        this.song.lyrics = new VideoSingKing (this.song.video);
        this.lyrics.appendChild (this.song.lyrics.canvas);
        let listener = () => this.items.add (this.song.lyrics);
        this.song.video.addEventListener ('timeupdate', listener, {once: true});
      });
      media.PLAY (this.background, offset);
    });
  }

  play (song)
  {
    this.stop ();

    // Chemin d'un fichier.
    let P = k => 'songs/' + song.id + '/' + song[k];

    // Événement 'playing' ?
    let playing = true;

    switch (song.type)
    {
      case 'mp3+cdg':
      {
        let audio = P ('audio');
        let lyrics = P ('lyrics');
        let height = song['cdg-height'] || DEFAULT_CDG_HEIGHT;
        let background = song['background'] ? P ('background') : DEFAULT_BACKGROUND;
        let offset = song['background-offset'] || 0;
        this.play_cdg (audio, lyrics, background, offset, height);
        break;
      }

      case 'karafun-xml':
      {
        let audio = P ('audio');
        let lyrics = P ('lyrics');
        let background = song['background'] ? P ('background') : DEFAULT_BACKGROUND;
        let offset = song['background-offset'] || 0;
        this.play_karafun_xml (audio, lyrics, background, offset);
        break;
      }

      case 'karafun-kfn':
      {
        let file = P ('file');
        let background = song['background'] ? P ('background') : DEFAULT_BACKGROUND;
        let offset = song['background-offset'] || 0;
        this.play_karafun_kfn (file, background, offset);
        break;
      }

      case 'karafun-kit':
      {
        let file = P ('file');
        let background = song['background'] ? P ('background') : DEFAULT_BACKGROUND;
        let offset = song['background-offset'] || 0;
        this.play_karafun_kit (file, background, offset);
        break;
      }

      case 'karafun':
      {
        let video = P ('video');
        let colors = song['karafun-colors'] || [];
        let background = song['background'] ? P ('background') : video;
        let offset = song['background-offset'] || 0;
        this.play_karafun (video, colors, background, offset);
        break;
      }

      case 'singking':
      {
        let video = P ('video');
        let background = song['background'] ? P ('background') : video;
        let offset = song['background-offset'] || 0;
        this.play_singking (video, background, offset);
        break;
      }

      default:
        playing = false;
        console.log (song);
    }

    if (playing)
    {
      let e = new Event ('playing');
      this.dispatchEvent (e);
    }
  }

  stop ()
  {
    // Événement 'ended' ?
    let ended = true;

    switch (this.song.type)
    {
      case 'mp3+cdg':
      case 'karafun-xml':
        this.lyrics.removeChild (this.song.lyrics.canvas);
        this.items.remove (this.song.lyrics);
        this.song.lyrics.stop ();
        media.DISPOSE (this.song.audio);
        media.DISPOSE (this.background);
        this.song = {type: null};
        break;

      case 'karafun-kfn':
      case 'karafun-kit':
        this.lyrics.removeChild (this.song.karafun.lyrics.canvas);
        this.items.remove (this.song.karafun.lyrics);
        this.song.karafun.stop ();
        media.DISPOSE (this.background);
        this.song = {type: null};
        break;

      case 'karafun':
      case 'singking':
        if (this.song.lyrics)
        {
          this.lyrics.removeChild (this.song.lyrics.canvas);
          this.items.remove (this.song.lyrics);
          this.song.lyrics.dispose ();
        }
        media.DISPOSE (this.song.video);
        media.DISPOSE (this.background);
        this.song = {type: null};
        break;

      default:
        ended = false;
    }

    if (ended)
    {
      let e = new Event ('ended');
      this.dispatchEvent (e);
    }
  }
}

export default Karaoke;

