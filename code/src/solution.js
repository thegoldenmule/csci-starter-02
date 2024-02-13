import geo from './geo.js';
import { loadShader } from './shaders.js';

/** @type {WebGLRenderingContext} */
let gl;

const mat4 = glMatrix.mat4;
const clearColor = { r: 0.5 * Math.random(), g:Math.random(), b:Math.random() };
const programs = {};
const shapes = [];

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
        const pointer = program.attributes.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(pointer, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pointer);

        if (uvbo) {
          const pointer = program.attributes.uv;
          if (pointer !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
            gl.vertexAttribPointer(pointer, 2, gl.FLOAT, false, 0, 0);
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

  programs.default = await loadShader(gl);

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