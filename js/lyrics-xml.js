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

function OPACITY (fadeinstart,  fadeinduration,
                  fadeoutstart, fadeoutduration)
{
  let f0 = FADE (fadeinstart,  0, fadeinstart  + fadeinduration,  1);
  let f1 = FADE (fadeoutstart, 1, fadeoutstart + fadeoutduration, 0);
  return t => Math.min (f0 (t), f1 (t));
}

// M I S C. ////////////////////////////////////////////////////////////////////

function ATTRIBS (xml, ...attribs)
{
  return attribs.map (a => [a, xml.getAttribute (a)]);
}

function TEXT (xml, selector)
{
  return xml.querySelector (selector).textContent;
}

function TIMECODE (code)
{
  const R = /^(-?\d+):(-?\d\d?):(-?\d\d?),(-?\d\d\d?)$/;
  let m = code.match (R);
  return [3600000, 60000, 1000, 1].reduce ((t, f, k) => t + f * parseInt (m [k+1]), 0);
}

// X M L ///////////////////////////////////////////////////////////////////////

function SYLLABLE (xml)
{
  let start = TIMECODE (TEXT (xml, 'start'));
  let end   = TIMECODE (TEXT (xml, 'end'));
  let text  = TEXT (xml, 'text');
  return {start, end, text};
}

function WORD (xml)
{
  let id = xml.getAttribute ('id');
  let syllables = xml.querySelectorAll ('syllabe');
  return {id, syllables: Array.from (syllables).map (s => SYLLABLE (s))};
}

function POSITION (xml)
{
  let attribs = ATTRIBS (xml, 'x', 'y', 'width', 'height');
  return Object.fromEntries (attribs.map (([k, v]) => [k, parseFloat (v)]));
}

function LINE (xml)
{
  let position = POSITION (xml.querySelector ('position'));
  let words = xml.querySelectorAll ('word');
  return {position, words: Array.from (words).map (xml => WORD (xml))};
}

function PAGE (xml)
{
  // Couleurs.
  const COLORS = ['activecolor', 'activebordercolor', 'inactivecolor', 'inactivebordercolor'];
  let colors = Object.fromEntries (ATTRIBS (xml, ...COLORS));
  // Animation.
  let fadeinstart     = TIMECODE (TEXT (xml, 'fadeinstart'));
  let fadeinduration  = TIMECODE (TEXT (xml, 'fadeinduration'));
  let fadeoutstart    = TIMECODE (TEXT (xml, 'fadeoutstart'));
  let fadeoutduration = TIMECODE (TEXT (xml, 'fadeoutduration'));
  // Lignes de texte.
  let lines = xml.querySelectorAll ('line');
  return {
    ...colors,
    opacity: OPACITY (fadeinstart, fadeinduration, fadeoutstart, fadeoutduration),
    lines: Array.from (lines).map (xml => LINE (xml))
  };
}

function KARAOKE (xml)
{
  let pages = xml.querySelectorAll ('page');
  //let events = xml.querySelectorAll ('event'); // FIXME
  return {
    pages: Array.from (pages).map (xml => PAGE (xml))
  };
}

// D R A W /////////////////////////////////////////////////////////////////////

function DRAW_SYLLABLE_PATTERN (c, inactive, active, s, t)
{
  if (t < s.start)
    return inactive;

  if (t > s.end)
    return active;

  let x = MIX (s.start, s.end, LINEAR (s.x0, s.x1)) (t);

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
  c.strokeText (s.text, s.x0, s.y);
}

function DRAW_SYLLABLE_FILL (c, p, s, t)
{
  const c0 = p.inactivecolor;
  const c1 = p.activecolor;
  c.fillStyle = DRAW_SYLLABLE_PATTERN (c, c0, c1, s, t);
  c.fillText (s.text, s.x0, s.y);
}

class LyricsXML
{
  constructor ()
  {
    let canvas = document.createElement ('canvas');
    canvas.width  = W;
    canvas.height = H;
    this.canvas = canvas;

    let context = canvas.getContext ('2d');
    context.font = FONT_HEIGHT + 'px' + ' ' + FONT_FAMILY;
    context.textBaseline = 'top';
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.lineWidth = 8;
    this.context = context;
  }

  load (url)
  {
    return fetch (url).
      then (r => r.text ()).
      then (text => {
        const parser = new DOMParser ();
        let xml = parser.parseFromString (text, 'application/xml');
        let response = xml.documentElement;
        console.log (response.getAttribute ('status'));
        //this.song = response.querySelector ('song'); // FIXME
        this.karaoke = KARAOKE (response.querySelector ('karaoke'));
        console.log (this.karaoke);

        // Chargement de la police.
        let font = new FontFace (FONT_FAMILY, FONT_SOURCE);
        return font.load ().then (() => {
          document.fonts.add (font);
          // Calcul de la largeur d'une espace.
          this.space = this.context.measureText (' ').width;
          // Calcul de la largeur de chaque syllabe.
          for (let p of this.karaoke.pages)
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
                return line_width + w.width + this.space;
              }, -this.space); // Suppression de l'espace de fin de ligne.

              // Position réelle du texte.
              let x0 = l.position.x + 0.5 * (l.position.width - l.width);
              let y0 = l.position.y + 0.5 * (l.position.height - FONT_HEIGHT);

              // Coordonnées de chaque syllabe.
              l.words.reduce ((line_width, w) =>
                w.syllables.reduce ((sx, s) => {
                  s.x0 = sx;
                  s.x1 = sx + s.width;
                  s.y  = y0;
                  return s.x1;
                }, line_width) + this.space,
                x0);
            }
        });
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

export default LyricsXML;

