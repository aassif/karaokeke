function ORDER (order = ['title', 'artist'])
{
  console.log (order);
  const o = new Intl.Collator ('fr', {sensitivity: 'base'});

  return function (s1, s2)
  {
    for (let key of order)
    {
      let c = o.compare (s1[key], s2[key]);
      if (c != 0) return c;
    }

    return 0;
  }
}

function WARNING_KEYS (song, ...keys)
{
  song.warning = keys.some (key => ! (key in song));
}

function WARNING (song)
{
  switch (song.type)
  {
    case 'mp3+cdg':
      WARNING_KEYS (song, 'background', 'audio', 'lyrics');
      break;

    case 'karafun':
      WARNING_KEYS (song, 'background', 'video', 'karafun-colors');
      break;

    case 'karafun-kfn':
    case 'karafun-kit':
      WARNING_KEYS (song, 'background', 'file');
      break;

    case 'singking':
      WARNING_KEYS (song, 'background', 'video');
      break;

    default:
      song.warning = true;
  }
}

function FETCH_SONG (id)
{
  return fetch ('songs/' + id + '/song.json').
    then (r => r.json ()).
    then (json => {
      let o = {...json, id};
      WARNING (o);
      return o;
    }).
    catch (e => {
      console.error (e);
    });
}

function FETCH (url, order = ['title', 'artist'])
{
  let songs = [];
  return fetch (url).
    then (r => r.json ()).
    then (json => Promise.all (json.map (id => FETCH_SONG (id).then (song => songs.push (song))))).
    then (() => songs.sort (ORDER (order)));
}

function QUERY (path, params)
{
  let url = path + '?' + new URLSearchParams (params);
  console.log (url);

  return fetch (url).
    then (r => r.json ()).
    then (json => json.success
      ? Promise.resolve (json.result)
      : Promise.reject (json.error));
}

function SAVE (song)
{
  let dir = 'songs/' + song.id;

  let o = {...song};
  delete o.id;
  delete o.warning;
  let json = JSON.stringify (o, null, 2);

  console.log (dir, json);
  return QUERY ('save.php', {dir, song: json});
}

export {FETCH, QUERY, SAVE, ORDER};

