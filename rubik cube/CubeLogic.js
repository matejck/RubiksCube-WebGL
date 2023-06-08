

import { vec3, quat } from '../lib/gl-matrix-module.js';

export class CubeLogic {
    constructor(cube) {
        this.cube = cube;
        this.n = this.cube.n;
    }

    toRadians(degrees) {
        return (degrees * Math.PI) / 180.0;
    }

    rotateZ(rZ, t, reverse) 
    {
        let f = 1;
        if(reverse)
            f = -1;
        for (let z = 0; z < this.n; z++) {
            if (z == rZ) {
                for (let x = 0; x < this.n; x++) {
                    for (let y = 0; y < this.n; y++) {
                        let qb = this.cube.cubies[x][y][z];
                        if(qb == undefined)
                            continue;
                        let r = quat.create();
                        quat.rotateZ(r, r, this.toRadians(90 * t * f));
                        quat.mul(r, r, qb.old_rotation);
                        
                        quat.normalize(r, r);

                        qb.rotation = r;

                        let current_translation = vec3.create();
                        vec3.transformQuat(current_translation, qb.old_translation, r);

                        qb.translation = current_translation;

                        if (t == 1) {
                            quat.copy(qb.old_rotation, qb.rotation);
                        }
                    }
                }
            }
        }
        if (t == 1) 
        {
            this.rotateZupdate(rZ, reverse);
        }
    }

    rotateZupdate(rZ, reverse) {
        let pos = Array(this.n);
        for (let i = 0; i < this.n; i++) {
            pos[i] = Array(this.n);
        }

        for (let z = 0; z < this.n; z++) {
            if (z == rZ) {
                for (let x = 0; x < this.n; x++) {
                    for (let y = 0; y < this.n; y++) {
                        let qb = this.cube.cubies[x][y][z];
                        if(qb == undefined)
                            continue;
                        pos[qb.x][qb.y] = qb;
                    }
                }
            }
        }

        if(reverse)
            this.rotate90Clockwise(pos);
        else
            this.rotate90CounterClockwise(pos);

        for (let x = 0; x < this.n; x++) {
            for (let y = 0; y < this.n; y++) {
                let qb = pos[x][y];
                if(qb == undefined)
                    continue;
                qb.coords = [x, y, rZ];
                this.cube.cubies[x][y][rZ] = qb;
            }
        }
    }

    rotateY(rY, t, reverse) {
        let f = 1;
        if(reverse)
            f = -1;
        for (let y = 0; y < this.n; y++) {
            if (y == rY) {
                for (let x = 0; x < this.n; x++) {
                    for (let z = 0; z < this.n; z++) {

                        let qb = this.cube.cubies[x][y][z];
                        if(qb == undefined)
                            continue;
                        let r = quat.create();
                        quat.rotateY(r, r, this.toRadians(-90 * t * f));
                        quat.mul(r, r, qb.old_rotation);

                        quat.normalize(r, r);

                        qb.rotation = r;

                        let current_translation = vec3.create();
                        vec3.transformQuat(current_translation, qb.old_translation, r);

                        qb.translation = current_translation;

                        if (t == 1) {
                            quat.copy(qb.old_rotation, qb.rotation);
                        }
                    }
                }
            }
        }
        if (t == 1) 
        {
            this.rotateYupdate(rY, reverse);
        }
    }

    rotateYupdate(rY, reverse) {
        let pos = Array(this.n);
        for (let i = 0; i < this.n; i++) {
            pos[i] = Array(this.n);
        }

        for (let y = 0; y < this.n; y++) {
            if (y == rY) {
                for (let x = 0; x < this.n; x++) {
                    for (let z = 0; z < this.n; z++) {
                        let qb = this.cube.cubies[x][y][z];
                        if(qb == undefined)
                            continue;
                        pos[qb.x][qb.z] = qb;
                    }
                }
            }
        }

        if(reverse)
            this.rotate90Clockwise(pos);
        else
            this.rotate90CounterClockwise(pos);

        for (let x = 0; x < this.n; x++) {
            for (let z = 0; z < this.n; z++) 
            {
                let qb = pos[x][z];
                if(qb == undefined)
                    continue;
                qb.coords = [x, rY, z];
                this.cube.cubies[x][rY][z] = qb;
            }
        }
    }

    rotateX(rX, t, reverse) 
    {
        let f = 1;
        if(reverse)
            f = -1;
        for (let x = 0; x < this.n; x++) {
            if (x == rX) {
                for (let y = 0; y < this.n; y++) {
                    for (let z = 0; z < this.n; z++) {
                        let qb = this.cube.cubies[x][y][z];
                        if(qb == undefined)
                            continue;
                        let r = quat.create();
                        quat.rotateX(r, r, this.toRadians(-90 * t * f));
                        quat.mul(r, r, qb.old_rotation);

                        quat.normalize(r, r);

                        qb.rotation = r;
                        let current_translation = vec3.create();
                        vec3.transformQuat(current_translation, qb.old_translation, r);

                        qb.translation = current_translation;

                        if (t == 1) {
                            quat.copy(qb.old_rotation, qb.rotation);
                        }
                    }
                }
            }
        }
        if (t == 1) 
        {
            this.rotateXupdate(rX, reverse);
        }
    }

    rotateXupdate(rX, reverse) {
        let pos = Array(this.n);
        for (let i = 0; i < this.n; i++) {
            pos[i] = Array(this.n);
        }

        for (let x = 0; x < this.n; x++) {
            if (x == rX) {
                for (let y = 0; y < this.n; y++) {
                    for (let z = 0; z < this.n; z++) {
                        let qb = this.cube.cubies[x][y][z];
                        if(qb == undefined)
                            continue;
                        pos[qb.y][qb.z] = qb;
                    }
                }
            }
        }

        if(reverse)
            this.rotate90CounterClockwise(pos);
        else
            this.rotate90Clockwise(pos);

        for (let y = 0; y < this.n; y++) {
            for (let z = 0; z < this.n; z++) {
                let qb = pos[y][z];
                if(qb == undefined)
                    continue;
                qb.coords = [rX, y, z];
                this.cube.cubies[rX][y][z] = qb;
            }
        }
    }

    rotate90Clockwise(mat) {
        for (let i = 0; i < parseInt(this.n / 2); i++) {
            for (let j = i; j < this.n - i - 1; j++) {
                var temp = mat[i][j];
                mat[i][j] = mat[this.n - 1 - j][i];
                mat[this.n - 1 - j][i] = mat[this.n - 1 - i][this.n - 1 - j];
                mat[this.n - 1 - i][this.n - 1 - j] = mat[j][this.n - 1 - i];
                mat[j][this.n - 1 - i] = temp;
            }
        }
    }

    rotate90CounterClockwise(mat) {
        for (let x = 0; x < this.n / 2; x++) {
            for (let y = x; y < this.n - x - 1; y++) {
                let temp = mat[x][y];
                mat[x][y] = mat[y][this.n - 1 - x];
                mat[y][this.n - 1 - x] = mat[this.n - 1 - x][this.n - 1 - y];
                mat[this.n - 1 - x][this.n - 1 - y] = mat[this.n - 1 - y][x];
                mat[this.n - 1 - y][x] = temp;
            }
        }
    }
}