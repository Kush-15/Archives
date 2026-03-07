varying float vDepth;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uNearClip;
uniform float uFarClip;

void main() {
  // Normalize depth between near and far clip
  float normalizedDepth = clamp(
    (vDepth - uNearClip) / (uFarClip - uNearClip),
    0.0,
    1.0
  );

  // Fresnel-like edge detection for x-ray feel
  vec3 viewDir = normalize(-vViewPosition);
  float fresnel = 1.0 - abs(dot(viewDir, vNormal));
  fresnel = pow(fresnel, 1.5);

  // Near = bright solid white, far = 12% opacity
  float depthOpacity = mix(0.85, 0.12, normalizedDepth);

  // Combine fresnel edge glow with depth opacity
  float alpha = mix(depthOpacity * 0.3, depthOpacity, fresnel);

  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
