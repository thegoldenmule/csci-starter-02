let gl;
let program;

const scene = [];

const createQuad = () => {
  const vertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -0.5, 0.5, 0,
      -0.5, -0.5, 0,
      0.5, -0.5, 0,
      0.5, 0.5, 0,
    ]),
    gl.STATIC_DRAW,
  );

  const indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([
      0, 1, 2, 0, 2, 3
    ]),
    gl.STATIC_DRAW,
  );

  return { vertices, indices };
};

window.init = async (canvas) => {
  gl = canvas.getContext('webgl2');

  // load, compile, link shader program
  {
    const vertex = await window.loadShader({
      gl,
      name: 'vertex',
      type: gl.VERTEX_SHADER,
    });
    const fragment = await window.loadShader({
      gl,
      name: 'fragment',
      type: gl.FRAGMENT_SHADER,
    });
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Could not compile Shader Program!');
    }
    gl.useProgram(program);
  }

  // create attributes
  {
    program.attributes = {
      p: gl.getAttribLocation(program, 'aVertexPosition'),
    };
  }

  // create a quad
  {
    const quad = createQuad();
    scene.push(quad);
  }
};

window.loop = (dt, canvas) => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  for (const obj of scene) {
    const { vertices, indices } = obj;
    
    // vertices!
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.vertexAttribPointer(
      program.attributes.p,
      3,
      gl.FLOAT,
      false, 0, 0);
    gl.enableVertexAttribArray(program.attributes.p);

    // indices!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.drawElements(
      gl.TRIANGLES,
      6, gl.UNSIGNED_SHORT, 0);
  }
};
