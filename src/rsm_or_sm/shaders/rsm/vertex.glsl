// we need to declare these when using RawShaderMaterial
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

 
// 
attribute vec2 uv;

// we will send uv to fragment shade with this
varying vec2 vUv;



attribute vec3 position;



void main(){
 
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);



  vec4 viewPosition = viewMatrix * modelPosition;

  vec4 projectedPosition = projectionMatrix * viewPosition;


  gl_Position = projectedPosition;

  // we did this to send uv coordinates to fragment shader
  // because we will need them in fragment shader
  vUv = uv;
}