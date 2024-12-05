// already defined with ShaderMaterial
// precision mediump float;

// we did receive this from vertex shader, because we did send it (not done by ShaderMaterial)
varying vec2 vUv;


void main() {

  
  // you can use round because it is available only when using ShaderMaterial
  // not available when using RawShaderMaterial
  float strength = round(vUv.x * 10.0) / 10.0;


  gl_FragColor = vec4(vec3(strength, strength, strength), 1.0);

}