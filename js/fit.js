function WIDTH (w0)
{
  return (w1, h1) => w1 < w0 ? [w1, h1] : [w0, Math.round (w0 * h1 / w1)];
}

function HEIGHT (h0)
{
  return (w1, h1) => h1 < h0 ? [w1, h1] : [Math.round (h0 * w1 / h1), h0];
}

function RECT (w0, h0)
{
  const W0 = WIDTH  (w0);
  const H0 = HEIGHT (h0);

  return (w1, h1) => {
    if (w0)
    {
      if (h0)
        return w0/h0 < w1/h1 ? H0 (w1, h1) : W0 (w1, h1);
      else
        return W0 (w1, h1);
    }
    else
    {
      if (h0)
        return H0 (w1, h1);
      else
        return [w1, h1];
    }
  }
}

export {WIDTH, HEIGHT, RECT};

