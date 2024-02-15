#version 300 es
precision mediump float;

in vec3 vColor;

out vec4 fragColor;

void main(void) {
  // Set the result as red
  fragColor = vec4(vColor, 1.0);
}
