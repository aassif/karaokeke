import Camera        from "./camera.js";
import LyricsCDG     from "./lyrics-cdg.js";
import VideoChroma   from "./video-chroma.js";
import VideoKaraFun  from "./video-karafun.js";
import VideoSingKing from "./video-singking.js";
import * as media    from "./media.js";

class Karaoke
{
  constructor ()
  {
    this.camera = new Camera ();
    this.lyrics = document.getElementById ('lyrics');
    this.background = document.getElementById ('background');
    this.song = {type: null};
  }

  set_camera (constraints, chroma_key)
  {
    this.camera.init (constraints).then (() => {
      let w = document.getElementById ('camera');
      if (this.chroma) w.removeChild (this.chroma.canvas);
      this.camera.video.play ();
      this.chroma = new VideoChroma (this.camera.video, chroma_key);
      w.appendChild (this.chroma.canvas);
    });
  }

  play_cdg (mp3, cdg, background, height)
  {
    this.stop ();

    this.song = {
      type: 'mp3+cdg',
      lyrics: new LyricsCDG (),
      audio: document.createElement ('audio')
    };

    let lyrics_ready = this.song.lyrics.load ('songs/'+cdg, height);
    let audio_ready = media.LOAD (this.song.audio, 'songs/'+mp3);
    let background_ready = media.LOAD (this.background, 'songs/'+background);

    Promise.all ([lyrics_ready, audio_ready, background_ready]).then (() => {
      this.song.lyrics.play ();
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.song.audio.play ();
      this.background.play ();
    });
  }

  play_karafun (video, colors, background)
  {
    this.stop ();

    this.song = {
      type: 'karafun',
      video: document.createElement ('video'),
      lyrics: null
    };

    let video_ready = media.LOAD (this.song.video, 'songs/'+video);
    let background_ready = media.LOAD (this.background, 'songs/'+background);

    Promise.all ([video_ready, background_ready]).then (() => {
      this.song.video.play ();
      this.song.lyrics = new VideoKaraFun (this.song.video, colors);
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.background.play ();
    });
  }

  play_singking (video, background)
  {
    this.stop ();

    this.song = {
      type: 'singking',
      video: document.createElement ('video'),
      lyrics: null
    };

    let video_ready = media.LOAD (this.song.video, 'songs/'+video);
    let background_ready = media.LOAD (this.background, 'songs/'+background);

    Promise.all ([video_ready, background_ready]).then (() => {
      this.song.video.play ();
      this.song.lyrics = new VideoSingKing (this.song.video);
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.background.play ();
    });
  }

  stop ()
  {
    switch (this.song.type)
    {
      case 'mp3+cdg':
        this.lyrics.removeChild (this.song.lyrics.canvas);
        this.song.lyrics.stop ();
        this.song.audio.pause ();
        this.song = {type: null};
        break;

      case 'karafun':
      case 'singking':
        this.song.video.pause ();
        if (this.song.lyrics)
        {
          this.lyrics.removeChild (this.song.lyrics.canvas);
          this.song.lyrics.dispose ();
        }
        this.song = {type: null};
        break;
    }

    this.background.pause ();
  }
}

export default Karaoke;

