<?php

// Message d'erreur et échec.
function error ($message)
{
  printf ('{"success":false,"error":"%s"}', $message);
  exit (1);
}

if (! array_key_exists ('dir', $_GET))
  error ('dir');

if (! array_key_exists ('song', $_GET))
  error ('song');

function f ($dir, $song)
{
  if (! is_dir ($dir))
    error ('is_dir');

  if (! file_put_contents ($dir . '/song.json', $song))
    error ('file_put_contents');

  printf ('{"success":true}');
  exit (0);
}

f ($_GET['dir'], $_GET['song']);

?>
