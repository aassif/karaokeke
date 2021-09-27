class VideoShader
{
  constructor (video, fragment)
  {
    let canvas = document.createElement ('canvas');

    console.log ('video-shader.js', video.videoWidth, video.videoHeight);
    //canvas.width  = video.videoWidth;
    //canvas.height = video.videoHeight;
    //canvas.width = 800;
    //canvas.height = 800 * video.videoHeight / video.videoWidth;
    canvas.width = 600 * video.videoWidth / video.videoHeight;
    canvas.height = 600;
    this.canvas = canvas;

    let gl = canvas.getContext ('webgl2', {preserveDrawingBuffer: true, premultipliedAlpha: false});
    this.gl = gl;

    let program = PROGRAM (gl, VERTEX_SHADER, fragment);
    gl.bindAttribLocation (program, 0, 'p');
    this.program = program;

    this.locations = {};

    this.video = video;
    this.texture = this.create_texture ();
    this.register_uniform ('texture');

    let QUAD = new Float32Array ([-1, -1, +1, -1, -1, +1, +1, +1]);
    let buffer = gl.createBuffer ();
    gl.bindBuffer (gl.ARRAY_BUFFER, buffer);
    gl.bufferData (gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    this.buffer = buffer;

    //this.draw ();
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
    gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
    gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i (this.locations['texture'], 0);

    this.update_uniforms ();

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

export default VideoShader;

