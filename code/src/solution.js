import geo from './geo.js';
import { create } from './node.js';
import { loadShader } from './shaders.js';

/** @type {WebGLRenderingContext} */
let gl;

const mat4 = glMatrix.mat4;
const clearColor = { r: 0.5 * Math.random(), g:Math.random(), b:Math.random() };
const programs = {};
const shapes = [];

window.init = async (canvas) => {
  // context
  gl = canvas.getContext('webgl2');
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1.0);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  programs.default = await loadShader(gl);

  const octohedron = create(gl, {
    ...geo.octohedron(),
    program: programs.default,
  });
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