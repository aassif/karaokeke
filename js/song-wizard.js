import STR from "./str.js";

class Wizard
{
  constructor (id, onsuccess, onerror)
  {
    this.root = document.getElementById (id);
    this.modal = new bootstrap.Modal (this.root);
    this.get ('form').onsubmit = () => {this.apply (); return false;};
    this.get ('.btn-primary').onclick = () => {this.apply ();};
    this.root.addEventListener ('show.bs.modal', () => {this.get ('form').reset ();});
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

  apply ()
  {
    console.log ('song-wizard.js', 'apply');

    let artist = this.get ('#new-artist').value;
    let title  = this.get ('#new-title').value;
    let video  = this.get ('#new-video').value;
    let type   = this.get('input[name="new-video-type"]:checked').value;

    let filename = STR (artist) + '-' + STR (title) + '/lyrics.mp4';
    console.log (filename);

    this.modal.hide ();

    let q = new URLSearchParams ([['url', video], ['output', 'songs/'+filename]]);
    let url = 'youtube-dl.php?' + q.toString ();
    console.log (url);

    fetch (url).
      then (r => r.json ()).
      then (json => {
        if (json.success)
          this.onsuccess ({artist, title, type, video: filename});
        else
          this.onerror ({artist, title, message: json.error});
      });
  }
}

export default Wizard;

