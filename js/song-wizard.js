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
  constructor (id, listener)
  {
    this.root = document.getElementById (id);
    this.modal = new bootstrap.Modal (this.root);
    this.get ('form').onsubmit = () => {this.apply (); return false;};
    this.get ('.btn-primary').onclick = () => {this.apply ();};
    this.root.addEventListener ('show.bs.modal', () => {this.get ('form').reset ();});
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

  apply ()
  {
    console.log ('song-wizard.js', 'apply');

    let artist = this.get ('#new-artist').value;
    let title  = this.get ('#new-title').value;
    let video  = this.get ('#new-video').value;
    let type   = this.get('input[name="new-video-type"]:checked').value;

    let filename = STR (artist) + '-' + STR (title) + '.mp4';
    console.log (filename);

    this.modal.hide ();

    let q = new URLSearchParams ([['url', video], ['output', 'songs/'+filename]]);
    let url = 'youtube-dl.php?' + q.toString ();
    console.log (url);

    fetch (url).
      then (r => r.json ()).
      then (json => {
        if (json.success)
          this.listener ({artist, title, type, video: filename});
        else
          console.error ('song-wizard.js:', json.error);
      });
  }
}

export default Wizard;
