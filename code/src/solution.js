
import geo from "./geo.js";
import { create } from "./node.js";
import { loadShader } from "./shaders.js";

/** @type {WebGLRenderingContext} */
let gl;

const { mat4, vec3, quat } = glMatrix;
const clearColor = {
  r: 0.25 * Math.random(),
  g:Math.random(),
  b:Math.random(),
};
const programs = {};
const scene = [];

window.init = async (canvas) => {
  // context
  gl = canvas.getContext('webgl2');
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1.0);
  gl.clearDepth(100);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // shaders
  programs.default = await loadShader(gl);

  // solar system
  const sun = create(gl, {
    program: programs.default,
    name: 'sun',
    ...geo.sphere(),
  });
  sun.acc = 0;
  scene.push(sun);

  const jupiter = create(gl, {
    program: programs.default,
    name: 'jupiter',
    ...geo.sphere(),
  });
  jupiter.position = vec3.fromValues(1.75, 0, 0);
  jupiter.scale = vec3.fromValues(0.5, 0.5, 0.5);
  jupiter.acc = 0;
  sun.children.push(jupiter);

  const europa = create(gl, {
    program: programs.default,
    name: 'europa',
    ...geo.sphere(),
  });
  europa.position = vec3.fromValues(1.8, 0, 0);
  europa.scale = vec3.fromValues(0.5, 0.5, 0.5);
  europa.acc = 0;
  jupiter.children.push(europa);

  const pluto = create(gl, {
    program: programs.default,
    name: 'pluto',
    ...geo.sphere(),
  });
  pluto.position = vec3.fromValues(1.8, 0, 0);
  pluto.scale = vec3.fromValues(0.5, 0.5, 0.5);
  europa.children.push(pluto);

  sun.update = (dt) => {
    const speed = 0.03;
    sun.acc += dt * speed;

    const angle = sun.acc % 360;
    sun.rotation = quat.fromEuler(
      sun.rotation,
      0, angle, 0);
  };

  jupiter.update = (dt) => {
    const speed = 0.1;
    jupiter.acc += dt * speed;

    const angle = jupiter.acc % 360;
    jupiter.rotation = quat.fromEuler(
      jupiter.rotation,
      0, angle, 0);
  };

  europa.update = (dt) => {
    const speed = 0.5;
    europa.acc += dt * speed;

    const angle = europa.acc % 360;
    europa.rotation = quat.fromEuler(
      europa.rotation,
      0, angle, 0);
  };
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

  // draw roots
  for (const node of scene) {
    drawGraph(node, null, dt, P, V);
  }
};

const drawGraph = (node, parent, dt, P, V) => {
  const { program, update, draw, children, } = node;
  if (update) {
    update(dt);
  }

  if (program) {
    const { uniforms, } = program;
    gl.useProgram(program);
    {
      gl.uniformMatrix4fv(uniforms.P, false, P);

      draw({ program, parent, V });
    }
  }

  // draw children
  for (const child of children) {
    drawGraph(child, node, dt, P, V);
  }
};
