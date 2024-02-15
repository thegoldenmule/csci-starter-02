#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

in vec3 aVertexPosition;
in vec3 aVertexColor;

out vec3 vColor;

void main(void) {
  vColor = aVertexColor;

  vec3 v = aVertexPosition;
  gl_Position = uProjectionMatrix
    * uModelViewMatrix
    * vec4(v, 1.0);
}
