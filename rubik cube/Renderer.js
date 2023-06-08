import { vec3, mat4 } from '../lib/gl-matrix-module.js';

import { WebGL } from '../common/engine/WebGL.js';

import { shaders } from './shaders.js';

import { CubeMaterial, CubeColor } from './CubeProperties.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(0.5, 0.5, 0.5, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    render(scene, camera, light) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.cubeShader;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projectionMatrix);
        gl.uniform3fv(uniforms.uCameraPosition, mat4.getTranslation(vec3.create(), camera.globalMatrix));

        gl.uniform3fv(uniforms.uLightColor,
            vec3.scale(vec3.create(), light.color, light.intensity / 255));
        gl.uniform3fv(uniforms.uLightPosition,
            mat4.getTranslation(vec3.create(), light.globalMatrix));
        gl.uniform3fv(uniforms.uLightAttenuation, light.attenuation);

        gl.uniform1f(uniforms.uGamma, CubeColor.GAMMA);

        this.renderNode(scene, scene.globalMatrix);
    }

    renderNode(node, modelMatrix) {
        const gl = this.gl;

        //modelMatrix = mat4.clone(modelMatrix);
        modelMatrix = node.globalMatrix;
        //mat4.mul(modelMatrix, modelMatrix, node.localMatrix);

        const { uniforms } = this.programs.cubeShader;

        if (node.model && node.textures != undefined) {
            gl.bindVertexArray(node.model.vao);

            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            
            gl.uniform1i(uniforms.uTexture, 0);

            gl.bindTexture(gl.TEXTURE_2D, node.textures[0]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.bindTexture(gl.TEXTURE_2D, node.textures[1]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12);

            gl.bindTexture(gl.TEXTURE_2D, node.textures[2]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 24);

            gl.bindTexture(gl.TEXTURE_2D, node.textures[3]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 36);

            gl.bindTexture(gl.TEXTURE_2D, node.textures[4]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 48);

            gl.bindTexture(gl.TEXTURE_2D, node.textures[5]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 60);
        
            gl.uniform1f(uniforms.uMaterialDiffuse, CubeMaterial.SHININESS);
            gl.uniform1f(uniforms.uMaterialSpecular, CubeMaterial.SPECULAR);
            gl.uniform1f(uniforms.uMaterialShininess, CubeMaterial.SHININESS);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    async loadModel(url) {
        const response = await fetch(url);
        const json = await response.json();
        return this.createModel(json);
    }

    async loadTexture(url, options) {
        const response = await fetch(url);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        const spec = Object.assign({ image }, options);
        return WebGL.createTexture(this.gl, spec);
    }

}
