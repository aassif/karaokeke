import {QUERY} from "./file.js";

function STR (s)
{
  return s.normalize ('NFD').
    replace (/\p{Diacritic}/gu, '').
    replace (/\W/g, '_').
    replace (/_+/g, '_').
    replace (/(^_|_$)/g, '').
    toLowerCase ();
}

class Wizard
{
  constructor (id, on_success, on_error)
  {
    this.root = document.getElementById (id);
    this.modal = new bootstrap.Modal (this.root);
    this.select ('form').onsubmit = () => {this.apply (); return false;};
    this.select ('.btn-primary').onclick = () => {this.apply ();};
    this.root.addEventListener ('show.bs.modal', () => {this.select ('form').reset ();});
    this.on_success = on_success;
    this.on_error   = on_error;
  }

  select (selector)
  {
    return this.root.querySelector (selector);
  }

  value (selector)
  {
    return this.select (selector).value;
  }

  set (selector, value)
  {
    this.select (selector).value = value;
  }

  apply ()
  {
    console.log ('song-wizard.js', 'apply');

    let artist = this.value ('#new-artist');
    let title  = this.value ('#new-title');
    let video  = this.value ('#new-video');

    let type   = this.value ('input[name="new-video-type"]:checked');

    let id = STR (artist) + '-' + STR (title);

    let song = {artist, title, type, id, warning: true};

    QUERY ('youtube-dl.php', {url: video, dir: 'songs/' + id}).
      then (r => {
        song.video = r.id + '.' + r.format_id + '.' + r.ext;
        return SAVE (song);
      }).
      then (() => this.on_success (song)).
      catch (e => this.on_error (song, e));

    this.modal.hide ();
  }
}

export default Wizard;

