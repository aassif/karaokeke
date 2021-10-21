<?php

header ('Content-Type: application/json');

define ('FORMAT', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/mp4[height<=720]');
define ('OUTPUT', '%(id)s.%(format_id)s.%(ext)s');

//define ('YTDL', "youtube-dl --print-json -f '%s' -o '%s/%s' %s");
define ('YTDL', "yt-dlp -j --no-simulate --no-progress -f '%s' -o '%s/%s' %s");

function error ($message)
{
  printf ('{"success" : false, "error" : "%s"}', $message);
  exit (1);
}

function f ($url, $output)
{
  $command = sprintf (YTDL, FORMAT, $_GET['dir'], OUTPUT, $_GET['url']);
  $ytdl = shell_exec ($command);
  if ($ytdl)
    printf ('{"success" : true, "result" : %s}', $ytdl);
  else
    error ('ytdl', $command);
}

if (! array_key_exists ('url', $_GET))
  error ('missing_argument', 'url');

if (! array_key_exists ('dir', $_GET))
  error ('missing_argument', 'dir');

f ($_GET['url'], $_GET['dir']);

?>
