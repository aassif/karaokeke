import VideoShader from "./video-shader.js";

class VideoSingKing extends VideoShader
{
  constructor (video)
  {
    super (video, FRAGMENT_SHADER);
    this.register_uniform ('resolution');
    this.draw ();
  }

  update_uniforms ()
  {
    this.gl.uniform2i (this.locations['resolution'], this.canvas.width, this.canvas.height);
  }
}

const TEST = `#version 100
precision mediump float;

uniform ivec2 resolution;
uniform sampler2D texture;
varying vec2 coords;

vec4 singking_test ()
{
  vec3 c = texture2D (texture, coords).rgb;
  if (coords.y < 0.15) return vec4 (1, c.g, c.b, 1);
  if (coords.y < 0.25) return vec4 (c.r, 1, c.b, 1);
  if (coords.y < 0.35) return vec4 (1, c.g, c.b, 1);
  if (coords.y < 0.45) return vec4 (c.r, 1, c.b, 1);
  if (coords.y < 0.55) return vec4 (1, c.g, c.b, 1);
  if (coords.y < 0.65) return vec4 (c.r, 1, c.b, 1);
  if (coords.y < 0.75) return vec4 (1, c.g, c.b, 1);
  if (coords.y < 0.85) return vec4 (c.r, 1, c.b, 1);
  return vec4 (1, c.g, c.b, 1);
}

void main ()
{
  gl_FragColor = singking_test ();
}`;

const FRAGMENT_SHADER = `#version 100
precision mediump float;

const int K = 2;

uniform ivec2 resolution;
uniform sampler2D texture;
varying vec2 coords;

const vec3 black = vec3 (0.0, 0.0, 0.0);

vec2 singking_coords (vec2 c)
{
  if (c.y < 0.15) return vec2 (c.x, c.y + 0.1);
  if (c.y < 0.25) return vec2 (c.x, c.y + 0.2);
  if (c.y < 0.35) return vec2 (c.x, c.y + 0.3);
  if (c.y < 0.45) return vec2 (c.x, c.y + 0.4);
  /*************/ return vec2 (c.x, c.y + 0.5);
}

vec3 singking_texture (vec2 c0)
{
  //vec2 c1 = singking_coords (c0);
  return texture2D (texture, c0).rgb;
}

vec4 singking ()
{
  vec3 rgb0 = singking_texture (coords);
  float d0 = distance (rgb0, black);
  if (d0 > 0.2) return vec4 (rgb0, 1);

  vec2 r = 1.0 / vec2 (resolution);
  for (int y = -K; y <= +K; ++y)
    for (int x = -K; x <= +K; ++x)
    {
      vec2 c1 = coords + vec2 (x, y) * r;
      vec3 rgb1 = singking_texture (c1);
      float d1 = distance (rgb1, black);
      if (d1 > 0.2) return vec4 (0, 0, 0, 1);
    }

  return vec4 (0);
}

void main ()
{
  gl_FragColor = singking ();
}`;

export default VideoSingKing;

