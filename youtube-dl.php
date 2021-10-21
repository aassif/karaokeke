<?php

header ('Content-Type: application/json');

define ('FORMAT', 'bestvideo[height<=720,ext=mp4]+bestaudio[ext=m4a]/mp4');
define ('OUTPUT', '%(id)s.%(format_id)s.%(ext)s');

function error ($message)
{
  printf ('{"success" : false, "error" : "%s"}', $message);
  exit (1);
}

function f ($url, $output)
{
  if (! file_exists ($output))
  {
    $command = sprintf ("youtube-dl --print-json -f '%s' -o '%s/%s' %s", FORMAT, $_GET['dir'], OUTPUT, $_GET['url']);
    $ytdl = shell_exec ($command);
    if ($ytdl)
      printf ('{"success" : true, "result" : %s}', $ytdl);
    else
      error ('ytdl', $command);
  }
  else
  {
    error ('file_exists', $output);
  }
}

if (! array_key_exists ('url', $_GET))
  error ('missing_argument', 'url');

if (! array_key_exists ('dir', $_GET))
  error ('missing_argument', 'dir');

f ($_GET['url'], $_GET['dir']);

?>
