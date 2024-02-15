
export const loadShader = async (gl, { v = 'vertex', f = 'fragment', attributes = [] } = {}) => {
  // load vertex and fragment shaders + create program
  const vertex = await window.loadShader({ gl, name: v, type: gl.VERTEX_SHADER });
  const fragment = await window.loadShader({ gl, name: f, type: gl.FRAGMENT_SHADER });
  
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`Could not init shaders: ${gl.getProgramInfoLog(program)}`);
    return;
  }

  program.attributes = {
    position: gl.getAttribLocation(program, 'aVertexPosition'),
    uv: gl.getAttribLocation(program, 'aTextureCoord'),
    color: gl.getAttribLocation(program, 'aVertexColor'),
  };

  for (const attr of attributes) {
    program.attributes[attr] = gl.getAttribLocation(program, attr);
  }

  program.uniforms = {};
  program.uniforms.P = gl.getUniformLocation(program, "uProjectionMatrix");
  program.uniforms.MV = gl.getUniformLocation(program, "uModelViewMatrix");
  program.uniforms.Color = gl.getUniformLocation(program, "uColor");

  return program;
};
