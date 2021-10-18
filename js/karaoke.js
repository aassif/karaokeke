import Camera        from "./camera.js";
import LyricsCDG     from "./lyrics-cdg.js";
import VideoChroma   from "./video-chroma.js";
import VideoKaraFun  from "./video-karafun.js";
import VideoSingKing from "./video-singking.js";
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

class Karaoke
{
  constructor ()
  {
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
      media.LOAD (this.background, background, offset < 0 ? -offset/1000 : 0)
    ];

    Promise.all (promises).then (() => {
      this.song.lyrics.play ();
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.items.add (this.song.lyrics);
      this.song.audio.play ();
      setTimeout (() => this.background.play (), offset > 0 ? offset : 0);
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
      media.LOAD (this.background, background, offset < 0 ? -offset/1000 : 0)
    ];

    Promise.all (promises).then (() => {
      this.song.video.play ().then ( () => {
        this.song.lyrics = new VideoKaraFun (this.song.video, colors);
        this.lyrics.appendChild (this.song.lyrics.canvas);
        let listener = () => this.items.add (this.song.lyrics);
        this.song.video.addEventListener ('timeupdate', listener, {once: true});
      });
      setTimeout (() => this.background.play (), offset > 0 ? offset : 0);
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
      media.LOAD (this.background, background, offset < 0 ? -offset/1000 : 0)
    ];

    Promise.all (promises).then (() => {
      this.song.video.play ().then (() => {
        this.song.lyrics = new VideoSingKing (this.song.video);
        this.lyrics.appendChild (this.song.lyrics.canvas);
        let listener = () => this.items.add (this.song.lyrics);
        this.song.video.addEventListener ('timeupdate', listener, {once: true});
      });
      setTimeout (() => this.background.play (), offset > 0 ? offset : 0);
    });
  }

  play (song)
  {
    this.stop ();

    // Chemin d'un fichier.
    let P = f => 'songs/' + song.id + '/' + f;

    switch (song.type)
    {
      case 'mp3+cdg':
      {
        let audio = P (song.audio);
        let lyrics = P (song.lyrics);
        let height = song['cdg-height'] || DEFAULT_CDG_HEIGHT;
        let background = song['background'] ? P (song['background']) : DEFAULT_BACKGROUND;
        let offset = song['background-offset'] || 0;
        this.play_cdg (audio, lyrics, background, offset, height);
        break;
      }

      case 'karafun':
      {
        let video = P (song.video);
        let colors = song['karafun-colors'] || [];
        let background = song['background'] ? P (song['background']) : video;
        let offset = song['background-offset'] || 0;
        this.play_karafun (video, colors, background, offset);
        break;
      }

      case 'singking':
      {
        let video = P (song.video);
        let background = song['background'] ? P (song['background']) : video;
        let offset = song['background-offset'] || 0;
        this.play_singking (video, background, offset);
        break;
      }

      default:
        console.log (song);
    }
  }

  stop ()
  {
    switch (this.song.type)
    {
      case 'mp3+cdg':
        this.lyrics.removeChild (this.song.lyrics.canvas);
        this.items.remove (this.song.lyrics);
        this.song.lyrics.stop ();
        media.DISPOSE (this.song.audio);
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
        this.song = {type: null};
        break;
    }

    media.DISPOSE (this.background);
  }
}

export default Karaoke;

