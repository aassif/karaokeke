import VideoShader from "./video-shader.js";

const DEFAULT_COLOR = '#ffffff';

function RGB (hex)
{
  const REGEX = /#([0-9a-f]{6})$/i;
  let m = hex.match (REGEX);
  return new Float32Array ([0, 2, 4].map (k => parseInt (m[1].substr (k, 2), 16) / 255.0));
}

function PAD (T, n, zero)
{
  let m = T.length;
  return Array.from ({length: n}, (t, k) => (k < m ? T[k] : (m > 0 ? T[m-1] : zero)));
}

class VideoKaraFun extends VideoShader
{
  constructor (video, colors)
  {
    super (video, FRAGMENT_SHADER);
    this.colors = PAD (colors, 4, DEFAULT_COLOR);
    this.register_uniform ('colors[0]');
    this.register_uniform ('colors[1]');
    this.register_uniform ('colors[2]');
    this.register_uniform ('colors[3]');
  }

  update_uniforms ()
  {
    let l = this.locations;
    this.gl.uniform3fv (l['colors[0]'], RGB (this.colors[0]));
    this.gl.uniform3fv (l['colors[1]'], RGB (this.colors[1]));
    this.gl.uniform3fv (l['colors[2]'], RGB (this.colors[2]));
    this.gl.uniform3fv (l['colors[3]'], RGB (this.colors[3]));
  }
}

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

const int N = 4;

in vec2 coords;

uniform sampler2D sampler;
uniform ivec2 resolution;
uniform vec3 colors [N];

out vec4 color;

const vec2 K [20] =
  vec2 [20]
  (
    /**********/ vec2 (-1,-2), vec2(0,-2), vec2(+1,-2), /**********/
    vec2(-2,-1), vec2 (-1,-1), vec2(0,-1), vec2(+1,-1), vec2(+2,-1),
    vec2(-2, 0), vec2 (-1, 0), /*********/ vec2(+1, 0), vec2(+2, 0),
    vec2(-2,+1), vec2 (-1,+1), vec2(0,+1), vec2(+1,+1), vec2(+2,+1),
    /**********/ vec2 (-1,+2), vec2(0,+2), vec2(+1,+2)  /**********/
  );

vec3 karafun_texture (vec2 c)
{
  return texture (sampler, c).rgb;
}

vec3 karafun_yuv (vec3 rgb)
{
  const mat4 M =
    mat4 (0.257,  0.439, -0.148, 0.0,
          0.504, -0.368, -0.291, 0.0,
          0.098, -0.071,  0.439, 0.0,
          0.0625, 0.500,  0.500, 1.0);

  return vec3 (M * vec4 (rgb, 1));
}

float karafun_distance (vec3 rgb1, vec3 rgb2)
{
  //vec3 w = vec3 (0.5, 1.0, 1.0);
  //vec3 yuv1 = w * karafun_yuv (rgb1);
  //vec3 yuv2 = w * karafun_yuv (rgb2);
  return distance (rgb1, rgb2);
}

bool karafun_filter (vec3 rgb)
{
  for (int i = 0; i < N; ++i)
  {
    float d = karafun_distance (rgb, colors[i]);
    if (d < 0.2) return true; // 0.2
  }

  return false;
}

vec4 karafun ()
{
  vec3 rgb0 = karafun_texture (coords);
  bool f0 = karafun_filter (rgb0);
  if (f0) return vec4 (rgb0, 1);

  vec2 r = 1.0 / vec2 (resolution);
  for (int k = 0; k < 20; ++k)
  {
    vec2 c1 = coords + K[k] * r;
    vec3 rgb1 = karafun_texture (c1);
    bool f1 = karafun_filter (rgb1);
    if (f1) return vec4 (rgb0, 1);
  }

  return vec4 (0);
}

void main ()
{
  color = karafun ();
}`;

export default VideoKaraFun;

