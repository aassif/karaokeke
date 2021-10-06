<?php

if (! array_key_exists ('url', $_GET))
  error ('url');

if (! array_key_exists ('dir', $_GET))
  error ('dir');

// Message d'erreur et échec.
function error ($message)
{
  printf ('{"success":false,"error":"%s"}', $message);
  exit (1);
}

// Enregistrement du buffer.
function w ($dir, $file, $data)
{
  if (file_exists ($dir . '/' . $file))
    error ('file_exists');

  file_put_contents ($dir . '/' . $file, $data);
  printf ('{"success":true,"result":"%s"}', $file);
  exit (0);
}

// Chargement du fichier, détection du type MIME et enregistrement.
function f ($url, $dir)
{
  $data = file_get_contents ($url);
  $finfo = finfo_open (FILEINFO_MIME);
  $mime = finfo_buffer ($finfo, $data);
  
  if (preg_match ('/^image\/([^;]*)(;.*)?$/', $mime, $matches))
  {
    switch ($matches[1])
    {
      case 'jpeg' : w ($dir, 'icon.jpg',  $data);
      case 'png'  : w ($dir, 'icon.png',  $data);
      case 'webp' : w ($dir, 'icon.webp', $data);
      case 'gif'  : w ($dir, 'icon.gif',  $data);
    }
  }
  error ('mime_type');
}

f ($_GET['url'], $_GET['dir']);

?>
