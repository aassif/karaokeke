class VideoShader
{
  constructor (video, fragment)
  {
    let canvas = document.createElement ('canvas');

    console.log (video.videoWidth, video.videoHeight);
    canvas.width = 480 * video.videoWidth / video.videoHeight;
    canvas.height = 480;
    this.canvas = canvas;

    let gl = canvas.getContext ('webgl2', {premultipliedAlpha: false});
    this.gl = gl;

    let program = PROGRAM (gl, VERTEX_SHADER, fragment);
    gl.bindAttribLocation (program, 0, 'p');
    this.program = program;

    this.locations = {};

    this.video = video;
    this.texture = this.create_texture ();
    this.register_uniform ('sampler');
    this.register_uniform ('resolution');

    let QUAD = new Float32Array ([-1, -1, +1, -1, -1, +1, +1, +1]);
    let buffer = gl.createBuffer ();
    gl.bindBuffer (gl.ARRAY_BUFFER, buffer);
    gl.bufferData (gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    this.buffer = buffer;
  }

  dispose ()
  {
    let gl = this.gl;
    gl.deleteTexture (this.texture);
    gl.deleteBuffer (this.buffer);
    gl.deleteProgram (this.program);
  }

  register_uniform (id)
  {
    this.locations[id] = this.gl.getUniformLocation (this.program, id);
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

  update_uniforms ()
  {
  }

  draw ()
  {
    let gl = this.gl;
    gl.clear (gl.COLOR_BUFFER_BIT);
    gl.useProgram (this.program);

    gl.activeTexture (gl.TEXTURE0);
    gl.bindTexture (gl.TEXTURE_2D, this.texture);
    gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
    gl.uniform1i (this.locations['sampler'], 0);

    gl.uniform2i (this.locations['resolution'], this.canvas.width, this.canvas.height);

    this.update_uniforms ();

    gl.bindBuffer (gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray (0);
    gl.vertexAttribPointer (0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays (gl.TRIANGLE_STRIP, 0, 4);
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

  let v = SHADER (gl, gl.VERTEX_SHADER,   vertex);   gl.attachShader (program, v);
  let f = SHADER (gl, gl.FRAGMENT_SHADER, fragment); gl.attachShader (program, f);

  gl.linkProgram (program);
  if (! gl.getProgramParameter (program, gl.LINK_STATUS))
    throw gl.getProgramInfoLog (program);

  gl.detachShader (program, v); gl.deleteShader (v);
  gl.detachShader (program, f); gl.deleteShader (f);

  return program;
}

const VERTEX_SHADER = `#version 300 es
precision mediump float;
in vec2 position;
out vec2 coords;
void main ()
{
  coords = position * 0.5 + 0.5;
  gl_Position = vec4 (position, 0, 1);
}`;

export default VideoShader;

