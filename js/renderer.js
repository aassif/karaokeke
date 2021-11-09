const W = 640;
const H = 480;

const FONT_FAMILY = 'OldSansBlack';
const FONT_SOURCE = 'url(OldSansBlack.woff)';
const FONT_HEIGHT = 40;

// A N I M A T I O N ///////////////////////////////////////////////////////////

function CLAMP (min, f, max)
{
  return (f < min ? min : (f < max ? f : max));
}

function LINEAR (x, y)
{
  return t => {
    const c = CLAMP (0, t, 1);
    return x * (1 - c) + y * c;
  };
}

function HERMITE (x, y)
{
  return t => {
    const c = CLAMP (0, t, 1);
    return x + c * c * (3 - 2 * c) * (y - x);
  };
}

function MIX (t0, t1, f = HERMITE (0, 1))
{
  return t => f ((t - t0) / (t1 - t0));
}

function FADE (t0, o0, t1, o1)
{
  return MIX (t0, t1, HERMITE (o0, o1));
}

function OPACITY (p)
{
  let f01 = FADE (p.fadeinstart,  0, p.fadeinstart  + p.fadeinduration,  1);
  let f10 = FADE (p.fadeoutstart, 1, p.fadeoutstart + p.fadeoutduration, 0);
  return t => Math.min (f01 (t), f10 (t));
}

// D R A W /////////////////////////////////////////////////////////////////////

function DRAW_SYLLABLE_PATTERN (c, inactive, active, s, t)
{
  if (t < s.start)
    return inactive;

  if (t > s.end)
    return active;

  let x = MIX (s.start, s.end, LINEAR (s.x1, s.x2)) (t);

  let pattern = document.createElement ('canvas');
  pattern.width = W;
  pattern.height = 1;

  let ctx = pattern.getContext ('2d');
  ctx.fillStyle = inactive;
  ctx.fillRect (0, 0, W, 1);
  ctx.fillStyle = active;
  ctx.fillRect (0, 0, x, 1);

  return c.createPattern (pattern, 'repeat-y');
}

function DRAW_SYLLABLE_STROKE (c, p, s, t)
{
  const c0 = p.inactivebordercolor;
  const c1 = p.activebordercolor;
  c.strokeStyle = DRAW_SYLLABLE_PATTERN (c, c0, c1, s, t);
  c.strokeText (s.text, s.x1, s.y);
}

function DRAW_SYLLABLE_FILL (c, p, s, t)
{
  const c0 = p.inactivecolor;
  const c1 = p.activecolor;
  c.fillStyle = DRAW_SYLLABLE_PATTERN (c, c0, c1, s, t);
  c.fillText (s.text, s.x1, s.y);
}

class Renderer
{
  constructor ()
  {
    let canvas = document.createElement ('canvas');
    canvas.width  = W;
    canvas.height = H;
    this.canvas = canvas;

    let context = canvas.getContext ('2d');
    context.font = FONT_HEIGHT + 'px' + ' ' + FONT_FAMILY;
    context.textBaseline = 'middle';
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = 8;
    this.context = context;
  }

  render ()
  {
    // Chargement de la police.
    let font = new FontFace (FONT_FAMILY, FONT_SOURCE);
    return font.load ().then (() => {
      document.fonts.add (font);
      // Calcul de la largeur d'une espace.
      let space = this.context.measureText (' ').width;
      // Calcul des coordonnées de chaque syllabe.
      for (let p of this.karaoke.pages)
      {
        p.opacity = OPACITY (p);
        for (let l of p.lines)
        {
          // Calcul de la largeur d'une ligne.
          l.width = l.words.reduce ((line_width, w) => {
            // Calcul de la largeur du mot.
            w.width = w.syllables.reduce ((word_width, s) => {
              // Largeur du texte de la syllabe.
              let m = this.context.measureText (s.text);
              s.width = m.width;
              return word_width + s.width;
            }, 0);
            return line_width + w.width + space;
          }, -space); // Suppression de l'espace de fin de ligne.

          // Position réelle du texte.
          let x0 = l.position.x + 0.5 * (l.position.width - l.width);
          let y0 = l.position.y + 0.5 * l.position.height;

          // Coordonnées de chaque syllabe.
          l.words.reduce ((line_width, w) =>
            w.syllables.reduce ((x, s) => {
              s.x1 = x;
              s.x2 = x + s.width;
              s.y  = y0;
              return s.x2;
            }, line_width) + space,
            x0);
        }
      }
    });
  }

  play ()
  {
    this.sync = performance.now ();
  }

  stop ()
  {
  }

  draw ()
  {
    // Date du dessin en milliseconds.
    let t = performance.now () - this.sync;

    let ctx = this.context;
    ctx.clearRect (0, 0, W, H);

    for (let page of this.karaoke.pages)
    {
      let opacity = page.opacity (t);
      if (opacity > 0)
      {
        ctx.globalAlpha = opacity;

        for (let line of page.lines)
          line.words.forEach (w => {
            w.syllables.forEach (s => DRAW_SYLLABLE_STROKE (ctx, page, s, t));
            w.syllables.forEach (s => DRAW_SYLLABLE_FILL   (ctx, page, s, t));
          });
      }
    }
  }
}

Renderer.OPACITY = OPACITY;

export default Renderer;

