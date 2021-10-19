<?php

header ('Content-Type: application/json');

define ('SONGS', 'songs');
define ('JSON', 'song.json');

$songs = [];

if ($dir = opendir (SONGS))
{
  while ($f = readdir ($dir))
  {
    if ($f === '.' || $f === '..') continue;
    $json = SONGS . '/' . $f . '/' . JSON;
    if (is_readable ($json)) $songs[] = $f;
  }
}

echo json_encode ($songs);

?>
