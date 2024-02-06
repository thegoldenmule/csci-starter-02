/** @type {WebGLRenderingContext} */
let gl;

const mat4 = glMatrix.mat4;
const clearColor = { r:Math.random(), g:Math.random(), b:Math.random() };
const programs = {};
const shapes = [];

let AttributeDefinitions;

const loadShader = async ({ v = 'vertex', f = 'fragment' } = {}) => {
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
    position: gl.getAttribLocation(program, AttributeDefinitions.POSITION.name),
    uv: gl.getAttribLocation(program, AttributeDefinitions.UV.name),
  };

  program.uniforms = {};
  program.uniforms.P = gl.getUniformLocation(program, "uProjectionMatrix");
  program.uniforms.MV = gl.getUniformLocation(program, "uModelViewMatrix");
  program.uniforms.Color = gl.getUniformLocation(program, "uColor");

  return program;
};

const initAttributeDefinitions = (gl) => {
  AttributeDefinitions = {
    POSITION: {
      key: 'position',
      name: 'aVertexPosition',
      size: 3,
      type: gl.FLOAT,
      normalize: false,
      stride: 0,
      offset: 0,
    },
    UV: {
      key: 'uv',
      name: 'aTextureCoord',
      size: 2,
      type: gl.FLOAT,
      normalize: false,
      stride: 0,
      offset: 0,
    }
  };
};

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

const generatePrimitive = ({ vertices, indices, uvs, transform, }) => {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  let uvbo;
  if (uvs) {
    uvbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(uvs),
      gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  const MV = mat4.create();

  const node = {
    program: programs.default,
    transform: transform || mat4.identity(mat4.create()),
    draw: ({ program, V }) => {
      const M = node.transform;
      mat4.multiply(MV, V, M);
      gl.uniformMatrix4fv(program.uniforms.MV, false, MV);

      // attributes
      {
        const { size, type, normalized, stride, offset } = AttributeDefinitions.POSITION;
        const pointer = program.attributes.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(pointer, size, type, normalized, stride, offset);
        gl.enableVertexAttribArray(pointer);

        if (uvbo) {
          const pointer = program.attributes.uv;
          if (pointer !== -1) {
            const { size, type, normalized, stride, offset } = AttributeDefinitions.UV;
            gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
            gl.vertexAttribPointer(pointer, size, type, normalized, stride, offset);
            gl.enableVertexAttribArray(pointer);
          }
        }
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },
  };

  return node;
};

window.init = async (canvas) => {
  // context
  gl = canvas.getContext('webgl2');
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1.0);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  initAttributeDefinitions(gl);

  programs.default = await loadShader();

  const ground = generatePrimitive(geo.quad());
  //shapes.push(ground);

  const octohedron = generatePrimitive(geo.octohedron());
  octohedron.update = (dt) => {
    const speed = 0.1;
    const angle = speed * dt * (Math.PI / 180);
    mat4.rotateX(octohedron.transform, octohedron.transform, angle);
    mat4.rotateY(octohedron.transform, octohedron.transform, angle);
  };
  shapes.push(octohedron);
};

window.loop = (dt, canvas) => {
  const { width, height } = canvas;

  // clear
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // setup matrices
  const P = mat4.perspective(mat4.create(),
    45 * (Math.PI / 180),
    width / height,
    0.1, 10000);

  const V = mat4.identity(mat4.create());
  mat4.translate(V, V, [0, 0, -3]);
  mat4.rotateX(V, V, 0.05 * Math.PI);
  for (const { program, update, draw } of shapes) {
    if (update) {
      update(dt);
    }

    const { uniforms, } = program;
    gl.useProgram(program);
    {
      gl.uniformMatrix4fv(uniforms.P, false, P);
    }

    draw({ program, V });
  }
};