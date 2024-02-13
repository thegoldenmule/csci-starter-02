const { mat4, vec3, quat } = glMatrix;

export const create = (gl, { program, vertices, indices, uvs, }) => {
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

  const M = mat4.create();
  const rotation = quat.create();
  const MV = mat4.create();

  const node = {
    program,
    transform: M,
    position: vec3.create(),
    scale: 1,
    draw: ({ program, V }) => {
      mat4.fromRotationTranslationScale(M,
        rotation,
        node.position,
        vec3.fromValues(node.scale, node.scale, node.scale),
      );

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
