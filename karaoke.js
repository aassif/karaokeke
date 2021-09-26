import Webcam    from "./webcam.js";
import LyricsCDG from "./lyrics-cdg.js";
import VideoMix  from "./video-mix.js";

function LOAD_MEDIA (media, path)
{
  let promise = new Promise (resolve => {
    media.addEventListener ('canplaythrough', resolve);
  });

  media.src = path;
  return promise;
}

class Karaoke
{
  constructor (canvas)
  {
    this.canvas = canvas;

/*
    let lyrics = new LyricsCDG ();
    this.lyrics = lyrics;

    let audio = document.createElement ('audio');
    this.audio = audio;
*/

    let constraints = {audio: false, video: true};
    let webcam = new Webcam (constraints);
    this.webcam = webcam;

    let background = document.createElement ('video');
    background.muted = true;
    background.loop = true;
    this.background = background;

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

    let lyrics_ready = this.song.lyrics.load (cdg);
    let audio_ready = LOAD_MEDIA (this.song.audio, mp3);
    let background_ready = LOAD_MEDIA (this.background, 'la-soupe-aux-choux.mp4');

    Promise.all ([lyrics_ready, audio_ready, this.webcam.ready, background_ready]).then (() => {
      this.song.lyrics.play ();
      this.song.audio.play ();
      this.webcam.video.play ();
      this.background.play ();
      this.mix = new VideoMix (this.canvas, this.song.lyrics.canvas, this.webcam.video, this.background);
    });
  }

  play_video (video)
  {
    this.stop ();

    this.song = {
      type: 'video',
      video: document.createElement ('video')
    };

    let video_ready = LOAD_MEDIA (this.song.video, video);
    let background_ready = LOAD_MEDIA (this.background, 'la-soupe-aux-choux.mp4');

    Promise.all ([video_ready, this.webcam.ready, background_ready]).then (() => {
      this.song.video.play ();
      this.webcam.video.play ();
      this.background.play ();
      this.mix = new VideoMix (this.canvas, this.song.video, this.webcam.video, this.background);
    });
  }

  stop ()
  {
    switch (this.song.type)
    {
      case 'mp3+cdg':
        this.song.lyrics.stop ();
        this.song.audio.pause ();
        this.song = {type: null};
        break;

      case 'video':
        this.song.video.pause ();
        this.song = {type: null};
        break;
    }

    this.background.pause ();
  }
}

export default Karaoke;

