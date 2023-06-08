import { GUI } from '../lib/dat.gui.module.js';
import { mat4, quat } from '../lib/gl-matrix-module.js';

import { Application } from '../common/engine/Application.js';
import { Node } from '../common/engine/Node.js';
import { OrbitController } from '../common/engine/OrbitController.js';

import { Renderer } from './Renderer.js';

import { Cube } from './Cube.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        const urlParams = new URLSearchParams(url);
        let n = urlParams.get('n');
        this.n = Number(n);

        this.renderer = new Renderer(gl);

        this.root = new Node();
        this.camera = new Node();
        this.light = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.light);

        this.light.position = [0, 2, 1];
        this.light.color = [255, 255, 255];
        this.light.intensity = this.n * 2 - 4;
        this.light.attenuation = [0.002, 0, 0.3];

        this.camera.projectionMatrix = mat4.create();
        this.camera.translation = [0, 2, this.n * 3 - 3];

        let cubie_model = await Promise.resolve(this.renderer.loadModel('./CubeModel.json'));

        let t1 = await Promise.resolve(this.renderer.loadTexture('../stickers/WHITE.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));
        let t2 = await Promise.resolve(this.renderer.loadTexture('../stickers/RED.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));
        let t3 = await Promise.resolve(this.renderer.loadTexture('../stickers/GREEN.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));
        let t4 = await Promise.resolve(this.renderer.loadTexture('../stickers/BLUE.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));
        let t5 = await Promise.resolve(this.renderer.loadTexture('../stickers/ORANGE.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));
        let t6 = await Promise.resolve(this.renderer.loadTexture('../stickers/YELLOW.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));
        let t7 = await Promise.resolve(this.renderer.loadTexture('../stickers/BLACK.png', { mip: true, min: gl.NEAREST_MIPMAP_NEAREST, mag: gl.NEAREST, }));

        let textures = [t1, t2, t3, t4, t5, t6, t7];
        this.cube = new Cube(this.n, this.renderer, this.root, cubie_model, textures, this.gl.canvas, this.camera);

        this.cameraController = new OrbitController(this.camera, this.gl.canvas, this.cube);

        this.cameraController.distance = this.n * 6;
        this.cameraController.yaw = Math.PI * 2 - Math.PI/4;
        this.cameraController.pitch = -Math.PI/8;

        this.cube.yaw = this.cameraController.yaw;
    }

    update(time, dt) 
    {
        this.cameraController.update(dt);  
        this.cube.update(dt);
        this.light.translation = this.camera.translation;
        this.light.position = this.camera.translation;
    }

    render() {
        this.renderer.render(this.root, this.camera, this.light);
    }

    resize(width, height) {
        const aspect = width / height;
        const fovy = Math.PI / 3;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projectionMatrix, fovy, aspect, near, far);
    }

    toRadians(degrees) {
        return (degrees * Math.PI) / 180.0;
    }
}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app.cube, 'sound');
gui.add(app.cube, 'isShuffling');
gui.add(app.cube, 'twistingSpeed', 4, 8);

