import * as media from "./media.js";

const COLOR = rgb => '#' + rgb.map (x => x.toString (16).padStart (2, '0')).join ('');

const DEFAULT_COLOR = '#ffffff';
const DEFAULT_HEIGHT = '50%';

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
  button.setAttribute ('data-karafun-color', color);
  button.style.backgroundColor = color;
  button.title = color.toUpperCase ();
  return button;
}

function BUTTON_PLUS ()
{
  let button = BUTTON ();
  button.innerHTML = '<i class="bi-plus-lg pe-none"></i>';
  return button;
}

function BLOCK_SET (block, display, disabled)
{
  block.style.display = display;
  block.querySelectorAll ('input').forEach (input => input.disabled = disabled);
}

const BLOCK_SHOW = block => BLOCK_SET (block, 'block', false);
const BLOCK_HIDE = block => BLOCK_SET (block, 'none',  true);

class Properties
{
  constructor (id, onsuccess, onerror)
  {
    this.root = document.getElementById (id);
    this.modal = new bootstrap.Modal (this.root);
    this.get ('form').onsubmit = () => {this.apply (); return false;};
    this.get ('.btn-primary').onclick = () => {this.apply ();};
    this.onsuccess = onsuccess;
    this.onerror = onerror;
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
    BLOCK_SHOW (cdg);
    // Variables dédiées.
    this.set ('#song-cdg-audio', this.song.audio);
    this.set ('#song-cdg-lyrics', this.song.lyrics);
    let h = this.song['cdg-height'] || DEFAULT_HEIGHT;
    let inputs = cdg.querySelectorAll ('input[name="song-cdg-height"]');
    inputs.forEach (input => input.checked = input.value === h);
    // Nettoyage à la sortie.
    let listener = () => BLOCK_HIDE (cdg);
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});
  }

  apply_cdg ()
  {
    return false;
  }

  show_karafun ()
  {
    // Variables locales.
    let active = -1;
    // Affichage du bloc KaraFun.
    let karafun = this.get ('#song-karafun');
    BLOCK_SHOW (karafun);
    // Propriétés KaraFun.
    let colors = this.get ('#song-karafun-colors');
    let data = this.song['karafun-colors'] || [];
    data.forEach ((c, k) => {
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
        e.target.setAttribute ('data-karafun-color', DEFAULT_COLOR);
        e.target.backgroundColor = DEFAULT_COLOR;
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
    media.LOAD (video, 'songs/' + this.song.id + '/' + this.song.video).
      then (() => {
        video.play ();
        video.onclick = media.ONCLICK (video, rgb => {
          console.log (rgb);
          if (active != -1)
          {
            let c = COLOR (rgb);
            let buttons = colors.querySelectorAll ('button.karafun-color');
            buttons [active].setAttribute ('data-karafun-color', c);
            buttons [active].style.backgroundColor = c;
          }
        });
      });
    let pause = this.get ('#song-karafun-pause');
    pause.innerHTML = '<i class="bi-pause-fill"></i>';
    pause.onclick = () => {
      if (video.paused)
      {
        video.play ();
        pause.innerHTML = '<i class="bi-pause-fill"></i>';
      }
      else
      {
        video.pause ();
        pause.innerHTML = '<i class="bi-play-fill"></i>';
      }
    };
    // Nettoyage à la sortie.
    let listener = () => {
      media.DISPOSE (video);
      colors.innerHTML = '';
      BLOCK_HIDE (karafun);
    };
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});
  }

  apply_karafun ()
  {
    let buttons = this.root.querySelectorAll ('.karafun-color');
    let colors = Array.from (buttons).map (c => c.getAttribute ('data-karafun-color'));
    let c1 = colors.filter (c => c !== null);

    let c0 = this.song['karafun-colors'] || [];
    let m = c0.length !== c1.length || c0.some ((v, k) => c0[k] !== c1[k]);
    this.song['karafun-colors'] = c1;
    return m;
  }

  show_singking ()
  {
    // Affichage du bloc SingKing.
    let singking = this.get ('#song-singking');
    BLOCK_SHOW (singking);
    // Propriétés SingKing.
    let video = this.get ('#song-singking-video');
    media.LOAD (video, 'songs/' + this.song.id + '/' + this.song.video).
      then (() => {
        video.play ();
      });
    // Nettoyage à la sortie.
    let listener = () => {
      media.DISPOSE (video);
      BLOCK_HIDE (singking);
    };
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});
  }

  apply_singking ()
  {
    return false;
  }

  show (song)
  {
    // Remise à zéro.
    this.get ('form').reset ();

    // Chanson en cours d'édition.
    this.song = song;

    // Propriétés génériques.
    this.set ('#song-title', this.song.title);
    this.set ('#song-artist', this.song.artist);

    // Vidéo de fond.
    let background = this.get ('#song-background');
    if (! this.song.background) BLOCK_SHOW (background);

    // Jaquette.
    let icon = this.get ('#song-icon');
    if (! this.song.icon) BLOCK_SHOW (icon);

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

    // Nettoyage à la sortie.
    let listener = () => {
      BLOCK_HIDE (background);
      BLOCK_HIDE (icon);
    }
    this.root.addEventListener ('hidden.bs.modal', listener, {once: true});

    this.modal.show ();
  }

  apply_input (key, selector)
  {
    let value = this.get (selector).value;

    if (this.song[key] === value)
      return false;

    this.song[key] = value;
    return true;
  }

  apply ()
  {
    console.log ('song-properties.js', 'apply');

    let edits = 0;
    edits += this.apply_input ('title',  '#song-title');
    edits += this.apply_input ('artist', '#song-artist');

    switch (this.song.type)
    {
      case 'mp3+cdg':
        edits += this.apply_cdg ();
        break;

      case 'karafun':
        edits += this.apply_karafun ();
        break;

      case 'singking':
        edits += this.apply_singking ();
        break;

      default:
        console.log (this.song.type);
    }

    if (edits > 0)
    {
      this.song.download = true;
      this.onsuccess (this.song, 'Modifications effectuées');
    }

    let dir = 'songs/' + this.song.id;
    console.log (dir);

    let background = this.get ('#song-background input').value;
    if (background.length > 0)
    {
      console.log ('background', background);

      let q = new URLSearchParams ([['url', background], ['dir', dir]]);
      let url = 'youtube-dl.php?' + q.toString ();
      console.log (url);

      fetch (url).
        then (r => r.json ()).
        then (json => {
          if (json.success)
          {
            let ytdl = json.result;
            let filename = ytdl.id + '.' + ytdl.format_id + '.' + ytdl.ext;
            this.song.background = filename;
            this.song.download = true;
            this.onsuccess (this.song, 'Arrière-plan téléchargé !');
          }
          else
            this.onerror (this.song, json.error);
        }).
        catch (e => {
          console.log (e);
          this.onerror (this.song, e);
        });
    }

    let icon = this.get ('#song-icon input').value;
    if (icon.length > 0)
    {
      console.log ('icon', icon);

      let q = new URLSearchParams ([['url', icon], ['dir', dir]]);
      let url = 'icon.php?' + q.toString ();
      console.log (url);

      fetch (url).
        then (r => r.json ()).
        then (json => {
          if (json.success)
          {
            console.log (json.result);
            this.song.icon = json.result;
            this.song.download = true;
            this.onsuccess (this.song, 'Illustration téléchargée !');
          }
          else
            this.onerror (this.song, json.error);
        });
    }

    this.modal.hide ();
  }
}

export default Properties;

