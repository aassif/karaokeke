import * as fs from 'fs';

const COLOR = rgb => '#' + rgb.map (x => x.toString (16).padStart (2, '0')).join ('');

// Remplace si existe.
function r (song, key, callback)
{
  let value = song[key];
  if (value) song[key] = callback (value);
}

// Répertoire.
function d (song)
{
  const REGEX = /^([^\/]*)\//;
  switch (song.type)
  {
    case 'mp3+cdg':
    {
      let m = song.audio.match (REGEX);
      if (! m) throw 'song_dir';
      return m[1];
    }

    case 'karafun':
    case 'singking':
    {
      let m = song.video.match (REGEX);
      if (! m) throw 'song_dir';
      return m[1];
    }

    default:
      throw 'song_type';
  }
}

fs.readFile ('songs.json', (read_error, data) => {
  if (read_error) {
    throw read_error;
  }

  let songs = JSON.parse (data);

  songs.forEach (song => {
    r (song, 'karafun-colors', colors => colors.map (rgb => COLOR (rgb)));
    console.log (song);

    let dir = d (song);

    let f = path => path.replace (new RegExp ('^' + dir + '/'), '');

    r (song, 'audio', f);
    r (song, 'video', f);
    r (song, 'lyrics', f);
    r (song, 'background', f);
    r (song, 'icon', f);

    let json = JSON.stringify (song, null, 2);
    let path = 'songs/' + dir + '/song.json';
    fs.writeFile (path, json, write_error => {
      if (write_error) throw write_error;
    });
  });
});

