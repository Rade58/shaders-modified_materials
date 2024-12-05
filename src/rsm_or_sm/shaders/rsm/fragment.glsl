precision mediump float;


// receiving uv coordinates from vertex shader because we sent them
varying vec2 vUv;


void main() {



  gl_FragColor = vec4(vUv, 1.0, 1.0);

}