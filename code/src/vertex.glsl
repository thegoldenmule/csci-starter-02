#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

in vec3 aVertexPosition;
in vec3 aVertexColor;
in float aVertexHeight;

out vec3 vColor;

void main(void) {
  vColor = aVertexColor;

  vec3 v = aVertexPosition + vec3(0, 0, aVertexHeight);
  gl_Position = uProjectionMatrix
    * uModelViewMatrix
    * vec4(v, 1.0);
}
