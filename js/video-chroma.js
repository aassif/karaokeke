import {RGB}       from "./data.js";
import VideoShader from "./video-shader.js";

class VideoChroma extends VideoShader
{
  constructor (video, chroma_key)
  {
    super (video, FRAGMENT_SHADER);

    this.chroma_key = chroma_key;
    this.register_uniform ('chroma_key');

    this.mirror_vertical = false;
    this.register_uniform ('mirror_vertical');

    this.mirror_horizontal = false;
    this.register_uniform ('mirror_horizontal');

    this.rotate = false;
    this.register_uniform ('time');
  }

  update_uniforms ()
  {
    let l = this.locations;
    this.gl.uniform3fv (l['chroma_key'],        RGB (this.chroma_key));
    this.gl.uniform1i  (l['mirror_vertical'],   this.mirror_vertical);
    this.gl.uniform1i  (l['mirror_horizontal'], this.mirror_horizontal);
    this.gl.uniform1f  (l['time'],              this.rotate ? performance.now () / 2000 : 0);
  }
}

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
uniform ivec2 resolution;
uniform vec3 chroma_key;

uniform float time;
uniform bool mirror_vertical;
uniform bool mirror_horizontal;

in vec2 coords;

out vec4 color;

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

const vec2 chroma_range = vec2 (0.05, 0.10);

float chroma_mask (vec3 rgb)
{
  vec2 r = chroma_range;
  vec3 k = chroma_yuv (chroma_key);
  vec3 x = chroma_yuv (rgb);
  float d = distance (x.yz, k.yz);
  return smoothstep (r.x, r.y, d);
}

vec4 chroma (vec3 rgb)
{
  return vec4 (rgb, chroma_mask (rgb));
}

// M A I N /////////////////////////////////////////////////////////////////////

vec2 fx_rotate (vec2 c)
{
  float t = time;
  vec2 r = vec2 (resolution);
  mat2 R = mat2 (cos (t), -sin (t), sin (t), cos (t));
  return 0.5 + (R * ((c - 0.5) * r) / r);
}

float fx_mirror_vertical (float x)
{
  return mirror_vertical ? (x > 0.5 ? x : 1.0 - x) : x;
}

float fx_mirror_horizontal (float y)
{
  return mirror_horizontal ? (y > 0.5 ? y : 1.0 - y) : y;
}

vec2 fx ()
{
  float x = fx_mirror_vertical   (coords.x);
  float y = fx_mirror_horizontal (coords.y);
  return fx_rotate (vec2 (x, y));
}

void main ()
{
  color = chroma (texture (sampler, fx ()).rgb);
}`;

export default VideoChroma;

