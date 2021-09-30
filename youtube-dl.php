<?php

header ('Content-Type: application/json');

define ('FORMAT', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');

$url    = $_GET['url']    ?? null;
$output = $_GET['output'] ?? null;

function error ($message)
{
  return printf ('{"success" : false, "error" : "%s"}', $command);
}

if (! file_exists ($output))
{
  $command = sprintf ("youtube-dl --print-json -f '%s' -o '%s' %s", FORMAT, $output, $url);
  $ytdl = shell_exec ($command);
  if ($ytdl)
    printf ('{"success" : true, "result" : %s}', $ytdl);
  else
    return error ('ytdl');
}
else
{
  return error ('file_exists');
}

?>
