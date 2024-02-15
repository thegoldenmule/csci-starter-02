
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
  programs.default = await loadShader(gl, {
    attributes: ['aVertexHeight'],
  });

  // solar system
  const { vertices, indices } = geo.sphere();
  const colors = new Float32Array(vertices.length);
  for (let i = 0; i < colors.length; i += 3) {
    const [vx, vy, vz] = vertices.slice(i, i + 3);
    const r = vx * 0.5 + 0.5;
    const g = vy * 0.5 + 0.5;
    const b = vz * 0.5 + 0.5;
    colors[i] = r;
    colors[i + 1] = g;
    colors[i + 2] = b;
  }

  const sun = create(gl, {
    program: programs.default,
    name: 'sun',
    vertices, indices, colors,
  });
  sun.acc = 0;
  //scene.push(sun);

  sun.update = (dt) => {
    const speed = 0.03;
    sun.acc += dt * speed;

    const angle = sun.acc % 360;
    sun.rotation = quat.fromEuler(
      sun.rotation,
      0, angle, 0);
  };

  const width = 10, height = 10;
  const groundGeo = geo.grid({ width, height });
  const groundColors = new Float32Array(groundGeo.vertices.length);
  for (let i = 0; i < groundColors.length; i += 3) {
    const [vx, vy, vz] = groundGeo.vertices.slice(i, i + 3);
    const r = 0.5 + vx * 0.5;
    const g = 0.5 + vy * 0.5;
    const b = 0.5 + vz * 0.5;
    groundColors[i] = r;
    groundColors[i + 1] = g;
    groundColors[i + 2] = b;
  }

  noise.seed(300);
  const groundHeight = new Array(groundGeo.vertices.length / 3);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const i = x * height + y;
      groundHeight[i] = 10 * noise.perlin2(x / 100, y / 100);
    }
  }

  const program = programs.default;
  const pointer = program.attributes.aVertexHeight;

  let hbo;
  if (pointer !== -1) {
    hbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundHeight), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  const ground = create(gl, {
    program: programs.default,
    name: 'ground',
    ...groundGeo,
    colors: groundColors,
    plugins: {
      draw: [
        () => {
          if (hbo === undefined) {
            return;
          }

          gl.bindBuffer(gl.ARRAY_BUFFER, hbo);
          gl.vertexAttribPointer(pointer, 1, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(pointer);
        },
      ],
    },
  });
  scene.push(ground);
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
