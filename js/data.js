function PAD (T, n, zero)
{
  let m = T.length;
  return Array.from ({length: n}, (t, k) => (k < m ? T[k] : (m > 0 ? T[m-1] : zero)));
}

function RGB (hex)
{
  const REGEX = /#([0-9a-f]{6})$/i;
  let m = hex.match (REGEX);
  return new Float32Array ([0, 2, 4].map (k => parseInt (m[1].substr (k, 2), 16) / 255.0));
}

function HEX (rgb)
{
  return '#' + rgb.map (x => x.toString (16).padStart (2, '0')).join ('');
}

export {PAD, RGB, HEX};

