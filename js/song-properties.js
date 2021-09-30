import * as media from "./media.js";

const COLOR = rgb => '#' + rgb.map (x => x.toString (16).padStart (2, '0')).join ('');

const DEFAULT_COLOR = [255, 255, 255];

function BUTTON ()
{
  let button = document.createElement ('button');
  button.type = 'button';
  button.className = 'btn border';
  button.style.width = '50px';
  button.style.height = '50px';
  button.style.backgroundClip = 'content-box';
  return button;
}

const BUTTON_COLOR_CLASSES = ['karafun-color', 'p-2', 'me-2'];

function BUTTON_COLOR (color)
{
  let button = BUTTON ();
  button.classList.add (...BUTTON_COLOR_CLASSES);
  button.style.backgroundColor = color;
  button.title = color.toUpperCase ();
  return button;
}

function BUTTON_PLUS ()
{
  let button = BUTTON ();
  button.innerHTML = '<i class="bi-plus-lg" style="pointer-events: none;"></i>';
  return button;
}

class Properties
{
  constructor (id, listener)
  {
    this.root = document.getElementById (id);
    this.modal = new bootstrap.Modal (this.root);
    this.get ('form').onsubmit = () => {this.apply (); return false;};
    this.get ('.btn-primary').onclick = () => {this.apply ();};
    this.listener = listener;
  }

  get (selector)
  {
    return this.root.querySelector (selector);
  }

  set (selector, value)
  {
    this.get (selector).value = value;
  }

  show_cdg ()
  {
    // Affichage du bloc dédié.
    let cdg = this.get ('#song-cdg');
    cdg.style.display = 'block';
    // Variables dédiées.
    this.set ('#song-cdg-audio', this.song.audio);
    this.set ('#song-cdg-lyrics', this.song.lyrics);
    // Nettoyage à la sortie.
    let listener = () => {cdg.style.display = 'none';};
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});
  }

  apply_cdg ()
  {
  }

  show_karafun ()
  {
    // Variables locales.
    let active = -1;
    let paused = false;
    // Affichage du bloc KaraFun.
    let karafun = this.get ('#song-karafun');
    karafun.style.display = 'block';
    // Propriétés KaraFun.
    let colors = this.get ('#song-karafun-colors');
    let data = this.song['karafun-colors'] || [];
    data.forEach ((rgb, k) => {
      let c = COLOR (rgb);
      let button = BUTTON_COLOR (c);
      button.onclick = () => {active = k;};
      colors.appendChild (button);
    });
    // S'il reste de la place...
    if (data.length < 4)
    {
      let callback = k => e => {
        // Couleur active.
        active = k;
        // Transformation du bouton.
        e.target.classList.add (...BUTTON_COLOR_CLASSES);
        e.target.backgroundColor = COLOR (DEFAULT_COLOR);
        e.target.innerHTML = '';
        e.target.onclick = () => {active = k;};
        // Nouveau bouton "plus".
        if (k+1 < 4)
        {
          let p = BUTTON_PLUS ();
          p.onclick = callback (k+1);
          colors.appendChild (p);
        }
      };
      // Premier bouton.
      let plus = BUTTON_PLUS ();
      colors.appendChild (plus);
      plus.onclick = callback (data.length);
    }
    let video = this.get ('#song-karafun-video');
    media.LOAD (video, 'songs/'+this.song.video).
      then (() => {
        video.play ();
        video.onclick = media.ONCLICK (video, rgb => {
          console.log (rgb);
          if (active != -1)
          {
            let buttons = colors.querySelectorAll ('button.karafun-color');
            buttons [active].style.backgroundColor = COLOR (rgb);
          }
        });
      });
    let pause = this.get ('#song-karafun-pause');
    pause.innerHTML = '<i class="bi-pause-fill"></i>';
    pause.onclick = () => {
      if (paused)
      {
        video.play ();
        pause.innerHTML = '<i class="bi-pause-fill"></i>';
        paused = false;
      }
      else
      {
        video.pause ();
        pause.innerHTML = '<i class="bi-play-fill"></i>';
        paused = true;
      }
    };
    // Nettoyage à la sortie.
    let listener = () => {
      colors.innerHTML = '';
      karafun.style.display = 'none';
    };
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});
  }

  apply_karafun ()
  {
    const REGEX = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/;
    let buttons = this.root.querySelectorAll ('.karafun-color');
    let colors = Array.from (buttons).map (c => c.style.backgroundColor.match (REGEX));
    let c = colors.filter (c => c !== null).map (c => c.slice (1).map (x => parseInt (x)));
    console.log (colors, c);
    this.song['karafun-colors'] = c;
  }

  show_singking ()
  {
    // Affichage du bloc SingKing.
    let singking = this.get ('#song-singking');
    singking.style.display = 'block';
    // Propriétés SingKing.
    let video = this.get ('#song-singking-video');
    media.LOAD (video, 'songs/'+this.song.video).
      then (() => {
        video.play ();
      });
    // Nettoyage à la sortie.
    let listener = () => {
      singking.style.display = 'none';
    };
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});
  }

  apply_singking ()
  {
  }

  show (song)
  {
    // Chanson en cours d'édition.
    this.song = song;

    // Propriétés génériques.
    this.set ('#song-title', this.song.title);
    this.set ('#song-artist', this.song.artist);

    switch (this.song.type)
    {
      case 'mp3+cdg':
        this.show_cdg ();
        break;

      case 'karafun':
        this.show_karafun ();
        break;

      case 'singking':
        this.show_singking ();
        break;

      default:
        console.log (this.song.type);
    }

    this.modal.show ();
  }

  apply ()
  {
    console.log ('song-properties.js', 'apply');

    this.song.title  = this.get ('#song-title').value;
    this.song.artist = this.get ('#song-artist').value;

    switch (this.song.type)
    {
      case 'mp3+cdg':
        this.apply_cdg ();
        break;

      case 'karafun':
        this.apply_karafun ();
        break;

      case 'singking':
        this.apply_singking ();
        break;

      default:
        console.log (song.type);
    }

    this.modal.hide ();
    this.listener ();
  }
}

export default Properties;

