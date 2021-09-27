// https://jbum.com//cdg_revealed.html

const W = 300, VW = 288;
const H = 216, VH = 192;

const MEMORY_PRESET            = 1;
const BORDER_PRESET            = 2;
const TILE_BLOCK               = 6;
const SCROLL_PRESET            = 20;
const SCROLL_COPY              = 24;
const DEFINE_TRANSPARENT_COLOR = 28;
const LOAD_COLOR_TABLE_LOWER   = 30;
const LOAD_COLOR_TABLE_UPPER   = 31;
const TILE_BLOCK_XOR           = 38;

const hex = n => Number (n).toString (16);
const rgb = ([r, g, b]) => 'rgb(' + (r<<4) + ',' + (g<<4) + ',' + (b<<4) + ')';

const K2 =
[
  /*******/ [-1, -2], [0, -2], [+1, -2], /*******/
  [-2, -1], [-1, -1], [0, -1], [+1, -1], [+2, -1],
  [-2,  0], [-1,  0], /******/ [+1,  0], [+2,  0],
  [-2, +1], [-1, +1], [0, +1], [+1, +1], [+2, +1],
  /*******/ [-1, +2], [0, +2], [+1, +2], /*******/
];

const K3 =
[
  /*******/ [-2, -3], [-1, -3], [0, -3], [+1, -3], [+2, -3], /*******/
  [-3, -2], [-2, -2], [-1, -2], [0, -2], [+1, -2], [+2, -2], [+3, -2],
  [-3, -1], [-2, -1], [-1, -1], [0, -1], [+1, -1], [+2, -1], [+3, -1],
  [-3,  0], [-2,  0], [-1,  0], /******/ [+1,  0], [+2,  0], [+3,  0], 
  [-3, +1], [-2, +1], [-1, +1], [0, +1], [+1, +1], [+2, +1], [+3, +1],
  [-3, +2], [-2, +2], [-1, +2], [0, +2], [+1, +2], [+2, +2], [+3, +2],
  /*******/ [-2, +3], [-1, +3], [0, +3], [+1, +3], [+2, +3], /*******/
];

class LyricsCDG
{
  constructor ()
  {
    this.transparent = -1;
    this.position = 0;
    this.palette = new Array (16);
    this.palette.fill ([0, 0, 0]);
//console.log (this.palette);
    this.buffer = new Uint8Array (W * H);
    this.buffer.fill (0);
//console.log (this.buffer);

    let canvas = document.createElement ('canvas');
    canvas.width  = 2 * VW;
    canvas.height = 2 * VH;
    this.canvas = canvas;
    //document.body.appendChild (canvas);

    let context = canvas.getContext ('2d');
    this.context = context;
  }

  load (cdg)
  {
    return fetch (cdg).
      then (r => r.arrayBuffer ()).
      then (buffer => {
        console.log (buffer);
        this.data = new Uint8Array (buffer);
      });
  }

  memory_preset (d)
  {
    let color  = d[0] & 0x0F;
    let repeat = d[1] & 0x0F;
    this.buffer.fill (color);
    //console.log ('MEMORY_PRESET', color, repeat);

    // FIXME
    this.define_transparent_color (d);
  }

  border_preset (d)
  {
    let color = d[0] & 0x0F;
    this.buffer.fill (color, 0, 12 * W);
    for (let y = 6, yw = y * W; y < 204; ++y, yw += W)
    {
      this.buffer.fill (color, yw, yw + 6);
      this.buffer.fill (color, yw + 294, yw + 300);
    }
    this.buffer.fill (color, 204 * W, 216 * W);
    //console.log ('BORDER_PRESET');
  }

  tile_block (d)
  {
    let color0 = d [0] & 0x0F;
    let color1 = d [1] & 0x0F;
    let row    = d [2] & 0x1F;
    let column = d [3] & 0x3F;
    let pixels = d.subarray (4, 16);

    for (let y = 0; y < 12; ++y)
      for (let x = 0; x < 6; ++x)
      {
        let o = (row * 12 + y) * W + (column * 6 + x);
        let c = (pixels[y] & (1<<(5-x))) ? color1 : color0;
        this.buffer [o] = c;
      }

    console.log ('TILE_BLOCK');
  }

  scroll_preset (d)
  {
    console.log ('SCROLL_PRESET');
  }

  scroll_copy (d)
  {
    console.log ('SCROLL_COPY');
  }

  define_transparent_color (d)
  {
    let color = d [0] & 0x0F;
    this.transparent = color;
    console.log ('DEFINE_TRANSPARENT_COLOR', color);
  }

  load_color_table (d, o)
  {
    //console.log ('LOAD_COLOR_TABLE', o);
    for (let i = 0; i < 8; ++i)
    {
      let data0 = d [2*i + 0];
      let data1 = d [2*i + 1];
      let r = (data0 & 0x3C) >> 2;
      let g = (data0 & 0x03) << 2 | (data1 & 0x30) >> 6;
      let b = (data1 & 0x0F);
      this.palette [o + i] = [r, g, b];
      //console.log (hex (i), hex (r), hex (g), hex (b));
    }
  }

  tile_block_xor (d)
  {
    let color0 = d [0] & 0x0F;
    let color1 = d [1] & 0x0F;
    let row    = d [2] & 0x1F;
    let column = d [3] & 0x3F;
    let pixels = d.subarray (4, 16);

    for (let y = 0; y < 12; ++y)
      for (let x = 0; x < 6; ++x)
      {
        let o = (row * 12 + y) * W + (column * 6 + x);
        let c = (pixels[y] & (1<<(5-x))) ? color1 : color0;
        this.buffer [o] ^= c;
      }

    //console.log ('TILE_BLOCK_XOR', color0, color1, row, column, pixels);
  }

  decode ()
  {
    let t = (Date.now () - this.sync);
    let packets = Math.floor (4 * 75 * t / 1000);
//console.log (packets);

    let p0 = this.position;
    let p1 = 24 * packets;
    let d = this.data, n = Math.min (p1, d.length);

    for (let k = p0; k < n; k += 24)
    {
      if ((d [k] & 0x3F) == 0x09)
      {
        let instruction = d [k+1];
        let data = d.subarray (k+4, k+20);

        switch (instruction)
        {
          case MEMORY_PRESET:
            this.memory_preset (data);
            break;

          case BORDER_PRESET:
            this.border_preset (data);
            break;

          case TILE_BLOCK:
            this.tile_block (data)
            break;

          case SCROLL_PRESET:
            this.scroll_preset (data);
            break;

          case SCROLL_COPY:
            this.scroll_copy (data);
            break;

          case DEFINE_TRANSPARENT_COLOR:
            this.define_transparent_color (data);
            break;

          case LOAD_COLOR_TABLE_LOWER:
            this.load_color_table (data, 0);
            break;

          case LOAD_COLOR_TABLE_UPPER:
            this.load_color_table (data, 8);
            break;

          case TILE_BLOCK_XOR:
            this.tile_block_xor (data);
            break;

          default:
            console.error ('?');
        }
      }
    }

    this.update_canvas ();

    if (p1 < d.length)
    {
      this.position = p1;
      this.request = requestAnimationFrame (() => this.decode ());
    }
    else
      this.context.clearRect (0, 0, 2*VW, 2*VH);
  }

  pixel_color (x, y)
  {
    let c = this.buffer [(12 + y) * W + (6 + x)];
    if (c != this.transparent)
    {
      let [r, g, b] = this.palette [c];
      return [r << 4, g << 4, b << 4, 255];
    }
    else
    {
      let border = false;
      for (let [dx, dy] of K2)
        if (this.buffer [(12 + y + dy) * W + (6 + x + dx)] != this.transparent)
            border = true;
      return [0, 0, 0, border ? 255 : 0];
    }
  }

  update_canvas ()
  {
    let image = new ImageData (VW, VH);
    for (let y = 0; y < VH; ++y)
      for (let x = 0; x < VW; ++x)
      {
        let [r, g, b, a] = this.pixel_color (x, y);
        image.data [(y * VW + x) * 4 + 0] = r;
        image.data [(y * VW + x) * 4 + 1] = g;
        image.data [(y * VW + x) * 4 + 2] = b;
        image.data [(y * VW + x) * 4 + 3] = a;
      }
    this.context.putImageData (image, VW/2, VH);
  }

  play ()
  {
    this.position = 0;
    this.sync = Date.now ();
    this.decode ();
  }

  stop ()
  {
    console.log ('lyrics.js: ', 'STOP!');
    cancelAnimationFrame (this.request);
    this.context.clearRect (0, 0, 2*VW, 2*VH);
  }
}

LyricsCDG.WIDTH  = VW;
LyricsCDG.HEIGHT = VH;

export default LyricsCDG;

