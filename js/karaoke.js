import Camera        from "./camera.js";
import LyricsCDG     from "./lyrics-cdg.js";
import VideoChroma   from "./video-chroma.js";
import VideoKaraFun  from "./video-karafun.js";
import VideoSingKing from "./video-singking.js";
import * as media    from "./media.js";

const DEFAULT_BACKGROUND = '_/nyan_cat.webm';
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

  play_cdg (mp3, cdg, background, height)
  {
    this.song = {
      type: 'mp3+cdg',
      lyrics: new LyricsCDG (),
      audio: document.createElement ('audio')
    };

    let promises =
    [
      this.song.lyrics.load ('songs/'+cdg, height),
      media.LOAD (this.song.audio, 'songs/'+mp3),
      media.LOAD (this.background, 'songs/'+background)
    ];

    Promise.all (promises).then (() => {
      this.song.lyrics.play ();
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.items.add (this.song.lyrics);
      this.song.audio.play ();
      this.background.play ();
    });
  }

  play_karafun (video, colors, background)
  {
    this.song = {
      type: 'karafun',
      video: document.createElement ('video'),
      lyrics: null
    };

    let promises =
    [
      media.LOAD (this.song.video, 'songs/'+video),
      media.LOAD (this.background, 'songs/'+background)
    ];

    Promise.all (promises).then (() => {
      this.song.video.play ().then (() => {
        this.song.lyrics = new VideoKaraFun (this.song.video, colors);
        this.lyrics.appendChild (this.song.lyrics.canvas);
        let listener = () => this.items.add (this.song.lyrics);
        this.song.video.addEventListener ('timeupdate', listener, {once: true});
      });
      this.background.play ();
    });
  }

  play_singking (video, background)
  {
    this.song = {
      type: 'singking',
      video: document.createElement ('video'),
      lyrics: null
    };

    let promises =
    [
      media.LOAD (this.song.video, 'songs/'+video),
      media.LOAD (this.background, 'songs/'+background)
    ];

    Promise.all (promises).then (() => {
      this.song.video.play ().then (() => {
        this.song.lyrics = new VideoSingKing (this.song.video);
        this.lyrics.appendChild (this.song.lyrics.canvas);
        let listener = () => this.items.add (this.song.lyrics);
        this.song.video.addEventListener ('timeupdate', listener, {once: true});
      });
      this.background.play ();
    });
  }

  play (song)
  {
    this.stop ();

    switch (song.type)
    {
      case 'mp3+cdg':
      {
        let height = song['cdg-height'] || DEFAULT_CDG_HEIGHT;
        let background = song['background'] || DEFAULT_BACKGROUND;
        this.play_cdg (song.audio, song.lyrics, background, height);
        break;
      }

      case 'karafun':
      {
        let colors = song['karafun-colors'] || [];
        let background = song['background'] || song.video;
        this.play_karafun (song.video, colors, background);
        break;
      }

      case 'singking':
      {
        let background = song['background'] || song.video;
        this.play_singking (song.video, background);
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

