import Webcam        from "./webcam.js";
import LyricsCDG     from "./lyrics-cdg.js";
//import VideoMix      from "./video-mix.js";
import VideoChroma   from "./video-chroma.js";
import VideoKaraFun  from "./video-karafun.js";
import VideoSingKing from "./video-singking.js";
import * as media    from "./media.js";

class Karaoke
{
  constructor ()
  {
    let constraints = {audio: false, video: true};
    this.webcam = new Webcam (constraints);
    this.webcam.ready.then (() => {
      this.webcam.video.play ();
      this.chroma = new VideoChroma (this.webcam.video);
      let w = document.getElementById ('webcam');
      w.appendChild (this.chroma.canvas);
    });

    this.lyrics = document.getElementById ('lyrics');
    this.background = document.getElementById ('background');

    this.song = {type: null};
  }

  play_cdg (mp3, cdg)
  {
    this.stop ();

    this.song = {
      type: 'mp3+cdg',
      lyrics: new LyricsCDG (),
      audio: document.createElement ('audio')
    };

    let lyrics_ready = this.song.lyrics.load ('songs/'+cdg);
    let audio_ready = media.LOAD (this.song.audio, 'songs/'+mp3);
    let background_ready = media.LOAD (this.background, 'backgrounds/la-soupe-aux-choux.mp4');
    //let background_ready = media.LOAD (this.background, 'backgrounds/nyan-cat.webm');

    Promise.all ([lyrics_ready, audio_ready, background_ready]).then (() => {
      this.song.lyrics.play ();
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.song.audio.play ();
      this.background.play ();
    });
  }

  play_karafun (video, colors)
  {
    this.stop ();

    this.song = {
      type: 'karafun',
      video: document.createElement ('video'),
      lyrics: null
    };

    let video_ready = media.LOAD (this.song.video, 'songs/'+video);
    let background_ready = media.LOAD (this.background, 'backgrounds/la-soupe-aux-choux.mp4');

    Promise.all ([video_ready, background_ready]).then (() => {
      this.song.video.play ();
      this.song.lyrics = new VideoKaraFun (this.song.video, colors);
      this.lyrics.appendChild (this.song.lyrics.canvas);
      this.background.play ();
    });
  }

  play_singking (video)
  {
    this.stop ();

    this.song = {
      type: 'singking',
      video: document.createElement ('video'),
      lyrics: null
    };

    let video_ready = media.LOAD (this.song.video, 'songs/'+video);
    let background_ready = media.LOAD (this.background, 'backgrounds/la-soupe-aux-choux.mp4');

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
        this.song.lyrics.stop ();
        this.lyrics.removeChild (this.song.lyrics.canvas);
        this.song.audio.pause ();
        this.song = {type: null};
        break;

      case 'karafun':
      case 'singking':
        this.song.video.pause ();
        if (this.song.lyrics)
          this.lyrics.removeChild (this.song.lyrics.canvas);
        this.song = {type: null};
        break;
    }

    this.background.pause ();
  }
}

export default Karaoke;

