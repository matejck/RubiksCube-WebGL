import { Cubie } from './Cubie.js';

import { Node } from '../common/engine/Node.js';

import { CubeLogic } from './CubeLogic.js';

import { vec3, vec4, mat4, quat } from '../lib/gl-matrix-module.js';

export class Cube extends Node {
    constructor(n, renderer, root, cubie_model, textures, domElement, camera) {
        super();

        this.domElement = domElement;
        this.camera = camera;

        domElement.addEventListener('mousedown', (event) => {
            this.clickDownHandler(event);
        });
        domElement.addEventListener('mouseup', (event) => {
            this.clickUpHandler(event);
        });

        
        this.WHITE = textures[0];
        this.RED = textures[1];
        this.GREEN = textures[2];
        this.BLUE = textures[3];
        this.ORANGE = textures[4];
        this.YELLOW = textures[5];
        this.BLACK = textures[6];

        this.renderer = renderer;
        this.offset = 0.025;
        this.root = root;
        this.root.addChild(this);
        this.n = n;
        this.cubie_model = cubie_model;

        this.cubies = Array(n);

        for (let x = 0; x < n; x++) {
            this.cubies[x] = Array(n);
            for (let y = 0; y < n; y++) {
                this.cubies[x][y] = Array(n);
                for (let z = 0; z < n; z++) {
                    if(x == 0 || x == this.n - 1 || y == 0 || y == this.n - 1 || z == 0 || z == this.n - 1)
                    {
                        let stickers = this.getStickers(x, y, z);

                        let cubie = new Cubie(this, cubie_model, stickers, x, y, z);

                        if (n % 2 != 0) // liho
                            cubie.position(this.oddCalc(x), this.oddCalc(y), this.oddCalc(z));
                        else // sodo
                            cubie.position(this.evenCalc(x), this.evenCalc(y), this.evenCalc(z));

                        this.cubies[x][y][z] = cubie;
                    }
                }
            }
        }

        this.logic = new CubeLogic(this);

        this.twistingSpeed = 6;
        this.isTwisting = false;
        this.isShuffling = false;
        this.finishedShuffling = true;
        this.sound = true;

        this.selected_cubie = null;
        this.selected_axis = null;
        this.downX = null;
        this.downY = null;
        this.rotateForward = false;
        this.rotateY = false;
        this.can_rotate_cube = true;

        this.t = 0;
        this.prevShuffleRotateAxis = undefined;
    }

    oddCalc(number) {
        return (2 + this.offset) * ((Math.floor(this.n / 2)) - number);
    }

    evenCalc(number) {
        return (2 + this.offset) * ((Math.floor(this.n / 2)) - number) - (2 + this.offset)/2;
    }

    setMoves(moves) {
        this.moves = moves;
    }

    addMove(move) {
        this.moves[this.moves.length] = move;
    }

    directionToRotation(origin, direction) {
        const rotation = quat.create();
        quat.rotationTo(rotation, origin, direction);
        return rotation;
    }

    raycast(mouseX, mouseY) {
        this.downX = mouseX;
        this.downY = mouseY;
        const camera = this.camera;
        const viewMatrix = camera.globalMatrix;
        const projectionMatrix = camera.projectionMatrix;

        mat4.invert(viewMatrix, viewMatrix);

        let clip = vec4.fromValues(mouseX, mouseY, -1, 1);

        let eye = vec4.create();
        let invProj = mat4.create();
        mat4.invert(invProj, camera.projectionMatrix);

        vec4.transformMat4(eye, clip, invProj);
        eye[2] = -1;
        eye[3] = 0;

        let world = vec4.create();
        vec4.transformMat4(world, eye, camera.globalMatrix);

        let ray_direction = vec3.fromValues(world[0], world[1], world[2]);
        vec3.normalize(ray_direction, ray_direction);

        let ray_start = camera.translation;
        let ray_end = vec3.create();
        vec3.scale(ray_end, ray_direction, 100);

        let found_cubie = null;
        let found_axis = null;
        for (let x = 0; x < this.n; x++) {
            for (let y = 0; y < this.n; y++) {
                for (let z = 0; z < this.n; z++) {
                    let qb = this.cubies[x][y][z];
                    if(qb == undefined)
                            continue;
                    let axis = qb.AABBtest(ray_start, ray_direction);
                    if (axis != false) {
                        let d = qb.distance(ray_start);
                        if (found_cubie == null) {
                            found_cubie = qb;
                            found_axis = axis;
                        }
                        else if (d < found_cubie.distance(ray_start)) {
                            found_cubie = qb;
                            found_axis = axis;
                        }
                    }
                }
            }
        }
        if (found_cubie) {
            this.selected_cubie = found_cubie;
            this.selected_axis = found_axis;
            this.can_rotate_cube = false;
        }

        //this.selected_cubie.textures = [this.WHITE, this.WHITE, this.WHITE, this.WHITE, this.WHITE, this.WHITE];
    }

    clickDownHandler(e) {
        if(!this.isTwisting)
        {
            this.raycast((e.clientX / (this.domElement.clientWidth)) * 2 - 1, (1 - e.clientY / (this.domElement.clientHeight)) * 2 - 1);
        }
        //this.raycast((e.clientX / (this.domElement.clientWidth)) * 2 - 1, (e.clientY / (this.domElement.clientHeight)) * 2 - 1);
    }

    clickUpHandler(e) 
    {
        if (!this.can_rotate_cube && !this.isTwisting) {
            let upX = (e.clientX / (this.domElement.clientWidth)) * 2 - 1;
            let upY = (1 - e.clientY / (this.domElement.clientHeight)) * 2 - 1;
            let downX = this.downX;
            let downY = this.downY;

            let diffX = Math.abs(upX - downX);
            let diffY = Math.abs(upY - downY);

            let rotateOffset = 0.05;

            if (diffX > diffY) {
                this.rotateY = true;
                if (diffX < rotateOffset) {
                    return;
                }

                if (upX > downX) {
                    this.rotateForward = true;
                }
                else {
                    this.rotateForward = false;
                }
            }
            else {
                this.rotateY = false;
                if (diffY < rotateOffset) {
                    return;
                }

                if (upY > downY) {
                    this.rotateForward = true;
                }
                else {
                    this.rotateForward = false;
                }
            }
            this.isTwisting = true;
        }
        this.can_rotate_cube = true;
    }

    shuffle(dt) 
    {
        if (this.t == 0) {
            this.shuffleRotateAxis = Math.round(Math.random() * 2);
            while (this.shuffleRotateAxis == this.prevShuffleRotateAxis) {
                this.shuffleRotateAxis = Math.round(Math.random() * 2);
            }
            this.prevShuffleRotateAxis = this.shuffleRotateAxis;
            this.shuffleDirection = Math.round(Math.random());
            this.shuffleIndex = Math.round(Math.random() * (this.n - 1));

            if (this.sound) {
                var audio = new Audio('TwistSound.mp3');
                audio.play();
            }
            this.finishedShuffling = false;
        }

        this.t += dt * this.twistingSpeed;
        if (this.t > 1) {
            this.t = 1;
        }

        switch (this.shuffleRotateAxis) {
            case 0: // rotate X
                if (this.shuffleDirection) {
                    this.logic.rotateX(this.shuffleIndex, this.t, false);
                }
                else {
                    this.logic.rotateX(this.shuffleIndex, this.t, true);
                }
                break;
            case 1: // rotate Y
                if (this.shuffleDirection) {
                    this.logic.rotateY(this.shuffleIndex, this.t, false);
                }
                else {
                    this.logic.rotateY(this.shuffleIndex, this.t, true);
                }
                break;
            case 2: // rotate Z
                if (this.shuffleDirection) {
                    this.logic.rotateZ(this.shuffleIndex, this.t, false);
                }
                else {
                    this.logic.rotateZ(this.shuffleIndex, this.t, true);
                }
                break;
        }
        if(this.t == 1)
        {
            this.finishedShuffling = true;
            this.t = 0;
        }
    }

    update(dt) 
    {
        if(this.isShuffling || !this.finishedShuffling)
        {
            this.shuffle(dt);
            return;
        }
        if (this.isTwisting) 
        {            
            if(this.t == 0)
            {
                this.can_rotate_cube = false;
                if (this.sound) {
                    var audio = new Audio('TwistSound.mp3');
                    audio.play();
                }
            }

            this.t += dt * this.twistingSpeed;
            
            if (this.t > 1) 
            {
                this.t = 1;
            }

            let qb = this.selected_cubie;
            if(this.yaw == undefined)
                this.yaw = 0;

            switch (1) {
                case this.selected_axis[0]:
                    if (this.rotateY) {
                        if (this.rotateForward) {
                            this.logic.rotateY(qb.y, this.t, true);
                        }
                        else {
                            this.logic.rotateY(qb.y, this.t, false);
                        }
                    }
                    else
                    {
                        if(qb.x == this.n - 1)
                        {
                            if (this.rotateForward) {

                                this.logic.rotateZ(qb.z, this.t, true);
                            }
                            else {
                                this.logic.rotateZ(qb.z, this.t, false);
                            }
                        }
                        else if(qb.x == 0)
                        {
                            if (this.rotateForward) {

                                this.logic.rotateZ(qb.z, this.t, false);
                            }
                            else {
                                this.logic.rotateZ(qb.z, this.t, true);
                            }
                        }
                    }
                    //console.log("Clicked on Z");
                    break;
                case this.selected_axis[1]:
                    //console.log(Math.PI * 2 - Math.PI/4, this.yaw, Math.PI/4);
                    if((Math.PI * 2 - Math.PI/4 < this.yaw && this.yaw > 0)
                        || (this.yaw > 0 && this.yaw < Math.PI/4))
                    {
                        if(this.rotateY)
                        {
                            if(qb.y == 0)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                                else {                                
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                            }
                            else if(qb.y == this.n - 1)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                                else {
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                            }
                        }
                        else
                        {
                            if (this.rotateForward) {
                                this.logic.rotateX(qb.x, this.t, false);
                            }
                            else {
                                this.logic.rotateX(qb.x, this.t, true);
                            }
                        }
                    }
                    else if(this.yaw > Math.PI/4 && this.yaw < (3 * Math.PI)/4)
                    {
                        if(!this.rotateY)
                        {
                            if(qb.y == 0)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                                else {                                
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                            }
                            else if(qb.y == this.n - 1)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                                else {
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                            }
                        }
                        else
                        {
                            if(qb.y == 0)
                            {
                                if (this.rotateForward) {                                   
                                    this.logic.rotateX(qb.x, this.t, false);
                                }
                                else {                                 
                                    this.logic.rotateX(qb.x, this.t, true);
                                }
                            }
                            else if(qb.y == this.n - 1)
                            {
                                if (this.rotateForward) {                                   
                                    this.logic.rotateX(qb.x, this.t, true);
                                }
                                else {                                 
                                    this.logic.rotateX(qb.x, this.t, false);
                                }
                            }
                        }
                    }
                    else if(this.yaw > (3 * Math.PI)/4 && this.yaw < (5 * Math.PI)/4)
                    {
                        if(this.rotateY)
                        {
                            if(qb.y == 0)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                                else {                                
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                            }
                            else if(qb.y == this.n - 1)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                                else {
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                            }
                        }
                        else
                        {
                            if (this.rotateForward) {
                                this.logic.rotateX(qb.x, this.t, true);
                            }
                            else {
                                this.logic.rotateX(qb.x, this.t, false);
                            }
                        }
                    }
                    else if(this.yaw > (5 * Math.PI)/4 && this.yaw < Math.PI * 2)
                    {
                        if(!this.rotateY)
                        {
                            if(qb.y == 0)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                                else {                                
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                            }
                            else if(qb.y == this.n - 1)
                            {
                                if (this.rotateForward) {
                                    this.logic.rotateZ(qb.z, this.t, true);
                                }
                                else {
                                    this.logic.rotateZ(qb.z, this.t, false);
                                }
                            }
                        }
                        else
                        {
                            if(qb.y == 0)
                            {
                                if (this.rotateForward) {                                   
                                    this.logic.rotateX(qb.x, this.t, true);
                                }
                                else {                                 
                                    this.logic.rotateX(qb.x, this.t, false);
                                }
                            }
                            else if(qb.y == this.n - 1)
                            {
                                if (this.rotateForward) {                                   
                                    this.logic.rotateX(qb.x, this.t, false);
                                }
                                else {                                 
                                    this.logic.rotateX(qb.x, this.t, true);
                                }
                            }
                        }
                    }
                    //console.log("Clicked on Y");
                    break;
                case this.selected_axis[2]:
                    if (this.rotateY) {
                        if (this.rotateForward) {
                            this.logic.rotateY(qb.y, this.t, true);
                        }
                        else {
                            this.logic.rotateY(qb.y, this.t, false);
                        }
                    }
                    else
                    {
                        if(qb.z == 0)
                        {
                            if (this.rotateForward) {
                                this.logic.rotateX(qb.x, this.t, false);
                            }
                            else {
                                this.logic.rotateX(qb.x, this.t, true);
                            }
                        }
                        else if(qb.z == this.n - 1)
                        {
                            if (this.rotateForward) {
                                this.logic.rotateX(qb.x, this.t, true);
                            }
                            else {
                                this.logic.rotateX(qb.x, this.t, false);
                            }
                        }
                    }
                    //console.log("Clicked on X");
                    break;
            }

            if (this.t == 1) {
                this.t = 0;
                this.isTwisting = false;
                this.can_rotate_cube = true;
            }
        }
    }

    setPosition(x, y, z) {
        this.translation = [x, y, z];
    }

   

    getStickers(x, y, z) {

        //TOP: 5
        //RIGHT: 3
        //FRONT: 0
        //LEFT: 2
        //BOTTOM: 4
        //BACK: 1

        //FRONT TOP
        if (x == 0 && y == 0 && z == 0) {
            return [this.BLUE, this.BLACK, this.BLACK, this.ORANGE, this.BLACK, this.WHITE];
        }
        if (x == this.n - 1 && y == 0 && z == 0) {
            return [this.BLUE, this.BLACK, this.RED, this.BLACK, this.BLACK, this.WHITE];
        }
        else if (x > 0 && y == 0 && z == 0) {
            return [this.BLUE, this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.WHITE];
        }

        //FRONT BOTTOM
        else if (x == 0 && y == this.n - 1 && z == 0) {
            return [this.BLUE, this.BLACK, this.BLACK, this.ORANGE, this.YELLOW, this.BLACK];
        }
        else if (x == this.n - 1 && y == this.n - 1 && z == 0) {
            return [this.BLUE, this.BLACK, this.RED, this.BLACK, this.YELLOW, this.BLACK];
        }
        else if (x > 0 && y == this.n - 1 && z == 0) {
            return [this.BLUE, this.BLACK, this.BLACK, this.BLACK, this.YELLOW, this.BLACK];
        }

        //FRONT MIDDLE
        else if (x == 0 && y > 0 && z == 0) {
            return [this.BLUE, this.BLACK, this.BLACK, this.ORANGE, this.BLACK, this.BLACK];
        }
        else if (x == this.n - 1 && y > 0 && z == 0) {
            return [this.BLUE, this.BLACK, this.RED, this.BLACK, this.BLACK, this.BLACK];
        }
        else if (x > 0 && y > 0 && z == 0) {
            return [this.BLUE, this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.BLACK];
        }

        //BACK TOP
        else if (x == this.n - 1 && y == 0 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.RED, this.BLACK, this.BLACK, this.WHITE];
        }
        else if (x == 0 && y == 0 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.BLACK, this.ORANGE, this.BLACK, this.WHITE];
        }
        else if (x > 0 && y == 0 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.BLACK, this.BLACK, this.BLACK, this.WHITE];
        }

        //BACK BOTTOM
        else if (x == this.n - 1 && y == this.n - 1 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.RED, this.BLACK, this.YELLOW, this.BLACK];
        }
        else if (x == 0 && y == this.n - 1 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.BLACK, this.ORANGE, this.YELLOW, this.BLACK];
        }
        else if (x > 0 && y == this.n - 1 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.BLACK, this.BLACK, this.YELLOW, this.BLACK];
        }

        //BACK MIDDLE
        else if (x == this.n - 1 && y > 0 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.RED, this.BLACK, this.BLACK, this.BLACK];
        }
        else if (x == 0 && y > 0 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.BLACK, this.ORANGE, this.BLACK, this.BLACK];
        }
        else if (x > 0 && y > 0 && z == this.n - 1) {
            return [this.BLACK, this.GREEN, this.BLACK, this.BLACK, this.BLACK, this.BLACK];
        }

        //TOP RIGHT/LEFT
        else if (x == 0 && y == 0 && z > 0) {
            return [this.BLACK, this.BLACK, this.BLACK, this.ORANGE, this.BLACK, this.WHITE];
        }
        else if (x == this.n - 1 && y == 0 && z > 0) {
            return [this.BLACK, this.BLACK, this.RED, this.BLACK, this.BLACK, this.WHITE];
        }

        //BOTTOM RIGHT/LEFT
        else if (x == 0 && y == this.n - 1 && z > 0) {
            return [this.BLACK, this.BLACK, this.BLACK, this.ORANGE, this.YELLOW, this.BLACK];
        }
        else if (x == this.n - 1 && y == this.n - 1 && z > 0) {
            return [this.BLACK, this.BLACK, this.RED, this.BLACK, this.YELLOW, this.BLACK];
        }

        //TOP MIDDLE
        else if (x > 0 && y == 0 && z > 0) {
            return [this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.WHITE];
        }

        //BOTTOM MIDDLE
        else if (x > 0 && y == this.n - 1 && z > 0) {
            return [this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.YELLOW, this.BLACK];
        }

        //RIGHT MIDDLE
        else if (x == 0 && y > 0 && z > 0) {
            return [this.BLACK, this.BLACK, this.BLACK, this.ORANGE, this.BLACK, this.BLACK];
        }

        //LEFT MIDDLE
        else if (x == this.n - 1 && y > 0 && z > 0) {
            return [this.BLACK, this.BLACK, this.RED, this.BLACK, this.BLACK, this.BLACK];
        }

        return [this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.BLACK, this.BLACK];
    }
}