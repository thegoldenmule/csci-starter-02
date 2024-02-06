let gl;
let program;

const clearColor = { r:0.5 * Math.random(), g:Math.random(), b:Math.random() };
const scene = [];

const geo = {
  quad: () => {
    return {
      vertices: [
        1, 0, 1,
        -1, 0, 1,
        -1, 0, -1,
        1, 0, -1,
      ],
      uvs: [
        1, 1,
        0, 1,
        0, 0,
        1, 0,
      ],
      indices: [
        0, 1, 2,
        0, 2, 3,
      ],
    };
  },

  octohedron: () => {
    return {
      vertices: [
        1, 0, 0,
        -1, 0, 0,
        0, 1, 0,
        0, -1, 0,
        0, 0, 1,
        0, 0, -1,
      ],
      uvs: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 0,
      ],
      indices: [
        4, 0, 2,
        4, 2, 1,
        4, 1, 3,
        4, 3, 0,
        5, 2, 0,
        5, 1, 2,
        5, 3, 1,
        5, 0, 3,
      ],
    };
  },
};

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

const createProgram = async ({ v = 'vertex', f = 'fragment' } = {}) => {
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
    
  };

  program.uniforms = {

  };
  
  return program;
};

window.init = async (canvas) => {
  gl = canvas.getContext('webgl2');
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1.0);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

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
  const { width, height } = canvas;
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
