import VideoShader from "./video-shader.js";

const RGB = rgb => new Float32Array (rgb.map (x => x/255.0));

function PAD (T, n)
{
  let m = T.length;
  return Array.from ({length: n}, (t, k) => (k < m ? T[k] : T[m-1]));
}

class VideoKaraFun extends VideoShader
{
  constructor (video, colors)
  {
    super (video, FRAGMENT_SHADER);
    this.colors = PAD (colors, 4);
console.log (this.colors);
    this.register_uniform ('resolution');
    this.register_uniform ('colors[0]');
    this.register_uniform ('colors[1]');
    this.register_uniform ('colors[2]');
    this.register_uniform ('colors[3]');
    this.draw ();
  }

  update_uniforms ()
  {
    let l = this.locations;
    this.gl.uniform2i (l['resolution'], this.canvas.width, this.canvas.height);
    this.gl.uniform3fv (l['colors[0]'], RGB (this.colors[0]));
    this.gl.uniform3fv (l['colors[1]'], RGB (this.colors[1]));
    this.gl.uniform3fv (l['colors[2]'], RGB (this.colors[2]));
    this.gl.uniform3fv (l['colors[3]'], RGB (this.colors[3]));
  }
}

const FRAGMENT_SHADER = `#version 100
precision mediump float;

const int N = 4;
const int K = 3;

varying vec2 coords;

uniform sampler2D texture;
uniform ivec2 resolution;
uniform vec3 colors [N];

vec3 karafun_texture (vec2 c)
{
  return texture2D (texture, c).rgb;
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
  for (int y = -K; y <= +K; ++y)
    for (int x = -K; x <= +K; ++x)
    {
      vec2 c1 = coords + vec2 (x, y) * r;
      vec3 rgb1 = karafun_texture (c1);
      bool f1 = karafun_filter (rgb1);
      //if (f1) return vec4 (0, 0, 0, 1);
      if (f1) return vec4 (rgb0, 1);
    }

  return vec4 (0);
}

void main ()
{
  gl_FragColor = karafun ();
}`;

export default VideoKaraFun;

