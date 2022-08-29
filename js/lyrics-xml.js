import Renderer from "./renderer.js";

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
  //let id = xml.getAttribute ('id');
  let syllables = xml.querySelectorAll ('syllabe');
  return {syllables: Array.from (syllables).map (s => SYLLABLE (s))};
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
  const ANIMATION = ['fadeinstart', 'fadeinduration', 'fadeoutstart', 'fadeoutduration'];
  let animation = Object.fromEntries (ANIMATION.map (tag => [tag, TIMECODE (TEXT (xml, tag))]));
  // Lignes de texte.
  let lines = xml.querySelectorAll ('line');
  return {
    ...colors,
    ...animation,
    //opacity: Renderer.OPACITY (fadeinstart, fadeinduration, fadeoutstart, fadeoutduration),
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

class LyricsXML extends Renderer
{
  constructor ()
  {
    super ();
  }

  parse_karaoke (xml)
  {
    this.karaoke = KARAOKE (xml);
    console.log (this.karaoke);
    return this.render ();
  }

  parse (text)
  {
    const parser = new DOMParser ();
    let xml = parser.parseFromString (text, 'application/xml');
    let response = xml.documentElement;
    //console.log (response.getAttribute ('status'));
    //this.song = response.querySelector ('song'); // FIXME
    return parse_karaoke (response.querySelector ('karaoke'));
  }

  load (url)
  {
    return fetch (url).
      then (r => r.text ()).
      then (text => this.parse (text));
  }
}

export default LyricsXML;

