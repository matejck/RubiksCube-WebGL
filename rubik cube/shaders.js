const vertexShader = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vPosition = (uModelMatrix * vec4(aPosition, 1)).xyz;
    vNormal = mat3(uModelMatrix) * aNormal;
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * (uViewMatrix * vec4(vPosition, 1));
}
`;

const fragmentShader = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

uniform vec3 uCameraPosition;

uniform vec3 uLightPosition;
uniform vec3 uLightAttenuation;
uniform vec3 uLightColor;

uniform float uMaterialDiffuse;
uniform float uMaterialSpecular;
uniform float uMaterialShininess;

uniform float uGamma;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 surfacePosition = vPosition;

    float d = distance(surfacePosition, uLightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation, vec3(1, d, d * d));

    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightPosition - surfacePosition);
    vec3 V = normalize(uCameraPosition - surfacePosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N)) * uMaterialDiffuse;
    float phong = pow(max(0.0, dot(V, R)), uMaterialShininess) * uMaterialSpecular;

    vec3 diffuseLight = lambert * attenuation * uLightColor;
    vec3 specularLight = phong * attenuation * uLightColor;

    vec3 albedo = pow(texture(uTexture, vTexCoord).rgb, vec3(uGamma));
    vec3 finalColor = albedo * diffuseLight + specularLight;
    oColor = pow(vec4(finalColor, 1), vec4(1.0 / uGamma));
}
`;

export const shaders = {
    cubeShader: { vertex: vertexShader, fragment: fragmentShader }
};
