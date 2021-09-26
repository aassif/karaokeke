class VideoMix
{
  constructor (canvas, lyrics, webcam, background)
  {
    this.chroma_lyrics = [128, 0, 0];
    this.chroma_webcam = [124, 161, 72];

    canvas.width  = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    this.canvas = canvas;

    let gl = canvas.getContext ('webgl2', {preserveDrawingBuffer: true, premultipliedAlpha: false});
    this.gl = gl;
    console.log ('VideoMix', gl);

    let program = PROGRAM (gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.bindAttribLocation (program, 0, 'p');
    this.program = program;

    this.chroma_lyrics_location = gl.getUniformLocation (program, 'chroma_lyrics');
    this.chroma_webcam_location = gl.getUniformLocation (program, 'chroma_webcam');

    const SOURCE =
      (element, name) => ({
        element,
        texture: this.create_texture (),
        location: gl.getUniformLocation (program, name)
      });

    this.lyrics     = SOURCE (lyrics,     'lyrics');
    this.webcam     = SOURCE (webcam,     'webcam');
    this.background = SOURCE (background, 'background');

    let QUAD = new Float32Array ([-1, -1, +1, -1, -1, +1, +1, +1]);
    let buffer = gl.createBuffer ();
    gl.bindBuffer (gl.ARRAY_BUFFER, buffer);
    gl.bufferData (gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    this.buffer = buffer;

    this.draw ();
  }

  create_texture ()
  {
    let gl = this.gl;
    let texture = gl.createTexture ();
    gl.bindTexture (gl.TEXTURE_2D, texture);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture (gl.TEXTURE_2D, null);
    return texture;
  }

  update_texture (k, source)
  {
    let gl = this.gl;
    gl.activeTexture (gl.TEXTURE0 + k);
    gl.bindTexture (gl.TEXTURE_2D, source.texture);
    gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.element);
    gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i (source.location, k);
  }

  draw ()
  {
    let gl = this.gl;
    gl.clear (gl.COLOR_BUFFER_BIT);
    gl.useProgram (this.program);

    this.update_texture (0, this.lyrics);
    this.update_texture (1, this.webcam);
    this.update_texture (2, this.background);

    gl.uniform3fv (this.chroma_lyrics_location, new Float32Array (this.chroma_lyrics.map (x => x/255)));
    gl.uniform3fv (this.chroma_webcam_location, new Float32Array (this.chroma_webcam.map (x => x/255)));

    gl.bindBuffer (gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray (0);
    gl.vertexAttribPointer (0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays (gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame (() => this.draw ());
  }
}

function SHADER (gl, type, source)
{
  const shader = gl.createShader (type);
  gl.shaderSource (shader, source);
  gl.compileShader (shader);
  if (! gl.getShaderParameter (shader, gl.COMPILE_STATUS))
    throw gl.getShaderInfoLog (shader);

  return shader;
}

function PROGRAM (gl, vertex, fragment)
{
  const program = gl.createProgram ();
  gl.attachShader (program, SHADER (gl, gl.VERTEX_SHADER,   vertex));
  gl.attachShader (program, SHADER (gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram (program);
  if (! gl.getProgramParameter (program, gl.LINK_STATUS))
    throw gl.getProgramInfoLog (program);

  return program;
}

const VERTEX_SHADER = `#version 100
precision mediump float;
attribute vec2 p;
varying vec2 coords;
void main ()
{
  coords = p * 0.5 + 0.5;
  gl_Position = vec4 (p, 0, 1);
}`;

const FRAGMENT_SHADER = `#version 100
precision mediump float;

uniform sampler2D lyrics;

const mat3 lyrics_matrix =
  mat3 (2.0, 0.0, 0.0,
        0.0, 2.0, 0.0,
       -0.5, 0.0, 1.0);
/*
  mat3 (1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0);
*/

uniform sampler2D webcam;

uniform sampler2D background;

varying vec2 coords;

vec2 lyrics_coords ()
{
  return (lyrics_matrix * vec3 (coords, 1)).xy;
}

// C H R O M A /// K E Y ///////////////////////////////////////////////////////

vec3 chroma_ycbcr (vec3 rgb)
{
  float y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  float cb = (rgb.b - y) * 0.565;
  float cr = (rgb.r - y) * 0.713;
  return vec3 (y, cb, cr);
}

vec3 chroma_yuv (vec3 rgb)
{
  const mat4 M =
    mat4 (0.257,  0.439, -0.148, 0.0,
          0.504, -0.368, -0.291, 0.0,
          0.098, -0.071,  0.439, 0.0,
          0.0625, 0.500,  0.500, 1.0);

  return vec3 (M * vec4 (rgb, 1));
}

uniform vec3 chroma_lyrics;
uniform vec3 chroma_webcam;

//const vec2 chroma_range = vec2 (0.05, 0.10);

float chroma_mask (vec3 rgb, vec3 key, vec2 r)
{
  //vec2 r = chroma_range;
  vec3 k = chroma_ycbcr (key);
  vec3 x = chroma_ycbcr (rgb);
  //if (x.x < 0.02) return 1.0;
  //if (x.x > 0.75) return 1.0;
  float d = distance (x.yz, k.yz);
  return smoothstep (r.x, r.y, d);
}

vec4 chroma (vec3 rgb, vec3 key, vec2 range)
{
  return vec4 (rgb, chroma_mask (rgb, key, range));
}

// M A I N /////////////////////////////////////////////////////////////////////

vec4 blend (vec4 src, vec4 dst)
{
  return dst * (1.0 - src.a) + vec4 (src.rgb, 1) * src.a;
}

void main ()
{
  //vec4 color0 = chroma (texture2D (lyrics, lyrics_coords ()).rgb, chroma_lyrics, vec2 (0.3, 0.4));
  vec4 color0 = texture2D (lyrics, lyrics_coords ());
  vec4 color1 = chroma (texture2D (webcam, coords).rgb, chroma_webcam, vec2 (0.05, 0.10));
  vec4 color2 = texture2D (background, coords);
  gl_FragColor = blend (color0, blend (color1, color2));
}`;

export default VideoMix;

