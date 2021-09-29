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

const TEST = `#version 300 es
precision mediump float;

uniform ivec2 resolution;
uniform sampler2D sampler;

in vec2 coords;

out vec4 color;

vec4 singking_test ()
{
  vec3 c = texture (sampler, coords).rgb;
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
  color = singking_test ();
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

const vec2 K [20] =
  vec2 [20]
  (
    /**********/ vec2 (-1,-2), vec2(0,-2), vec2(+1,-2), /**********/
    vec2(-2,-1), vec2 (-1,-1), vec2(0,-1), vec2(+1,-1), vec2(+2,-1),
    vec2(-2, 0), vec2 (-1, 0), /*********/ vec2(+1, 0), vec2(+2, 0),
    vec2(-2,+1), vec2 (-1,+1), vec2(0,+1), vec2(+1,+1), vec2(+2,+1),
    /**********/ vec2 (-1,+2), vec2(0,+2), vec2(+1,+2)  /**********/
  );

uniform ivec2 resolution;
uniform sampler2D sampler;
in vec2 coords;
out vec4 color;

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
  return texture (sampler, c0).rgb;
}

vec4 singking ()
{
  vec3 rgb0 = singking_texture (coords);
  float d0 = distance (rgb0, black);
  if (d0 > 0.2) return vec4 (rgb0, 1);

  vec2 r = 1.0 / vec2 (resolution);
  for (int k = 0; k < 20; ++k)
  {
    vec2 c1 = coords + K[k] * r;
    vec3 rgb1 = singking_texture (c1);
    float d1 = distance (rgb1, black);
    if (d1 > 0.2) return vec4 (0, 0, 0, 1);
  }

  return vec4 (0);
}

void main ()
{
  color = singking ();
}`;

export default VideoSingKing;

