import VideoShader from "./video-shader.js";

class VideoChroma extends VideoShader
{
  constructor (video)
  {
    super (video, FRAGMENT_SHADER);

    this.chroma_key = [124, 161, 72];
    this.register_uniform ('chroma_key');

    this.draw ();
  }

  update_uniforms ()
  {
    let k = this.chroma_key.map (x => x/255);
    this.gl.uniform3fv (this.locations['chroma_key'], new Float32Array (k));
  }
}

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform sampler2D sampler;

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

uniform vec3 chroma_key;

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

void main ()
{
  color = chroma (texture (sampler, coords).rgb);
}`;

export default VideoChroma;

