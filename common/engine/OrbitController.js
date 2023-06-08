import { quat, vec3 } from '../../lib/gl-matrix-module.js';

export class OrbitController {

    constructor(node, domElement, cube) {
        this.node = node;
        this.domElement = domElement;
        this.cube = cube;

        this.pitch = 0;
        this.yaw = 0;
        this.distance = 10;

        this.moveSensitivity = 0.004;

        this.initHandlers();
    }

    initHandlers() 
    {
        this.pointerdownHandler = this.pointerdownHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        element.addEventListener('pointerdown', this.pointerdownHandler);
    }

    pointerdownHandler(e) {
        this.domElement.setPointerCapture(e.pointerId);
        this.domElement.removeEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.addEventListener('pointerup', this.pointerupHandler);
        this.domElement.addEventListener('pointermove', this.pointermoveHandler);
    }

    pointerupHandler(e) {
        this.domElement.releasePointerCapture(e.pointerId);
        this.domElement.addEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.removeEventListener('pointerup', this.pointerupHandler);
        this.domElement.removeEventListener('pointermove', this.pointermoveHandler);
    }

    pointermoveHandler(e) {
        if(this.cube.can_rotate_cube)
        {
            const dx = e.movementX;
            const dy = e.movementY;
    
            this.pitch -= dy * this.moveSensitivity;
            this.yaw   -= dx * this.moveSensitivity;
    
            if(this.pitch > Math.PI/3)
                this.pitch = Math.PI/3;
            else if( this.pitch < -Math.PI/3)
                this.pitch = -Math.PI/3;

            const twopi = Math.PI * 2;
    
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
            this.cube.yaw = this.yaw;
        }
        
    }

    update() 
    {
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;

        const translation = [0, 0, this.distance];
        vec3.rotateX(translation, translation, [0, 0, 0], this.pitch);
        vec3.rotateY(translation, translation, [0, 0, 0], this.yaw);
        this.node.translation = translation;
    }

}
