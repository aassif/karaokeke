export default function STR (s)
{
  return s.normalize ('NFD').
    replace (/\p{Diacritic}/gu, '').
    replace (/\W/g, '_').
    replace (/_+/g, '_').
    replace (/(^_|_$)/g, '').
    toLowerCase ();
}

