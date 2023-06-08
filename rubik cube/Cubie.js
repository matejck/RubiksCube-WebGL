import { Node } from '../common/engine/Node.js';
import { vec3, mat4, quat } from '../lib/gl-matrix-module.js';

export class Cubie extends Node
{
    constructor(root, model, stickers, x, y, z)
    {
        super();

        this.coords = [x, y, z]

        this.old_rotation = quat.create();
        quat.copy(this.old_rotation, this.rotation);

        this.old_translation = vec3.create();
        this.root = root;
        this.root.addChild(this);
        this.model = model;
        this.textures = stickers;
    }

    position(x, y, z)
    {
        this.translation = [x, y, z];
        this.old_translation = vec3.create();
        vec3.copy(this.old_translation, this.translation);
    }

    distance(point)
    {
        return vec3.dist(point, this.translation);
    }

    AABBtest(origin, direction)
    {
        let ray_direction = vec3.create();
        vec3.copy(ray_direction, direction);
        let tmp;

        let minX = this.translation[0] - 1;
        let maxX = this.translation[0] + 1;
        let minY = this.translation[1] - 1;
        let maxY = this.translation[1] + 1;
        let minZ = this.translation[2] - 1;
        let maxZ = this.translation[2] + 1;

        let txMin = (minX - origin[0]) / direction[0];
        let txMax = (maxX - origin[0]) / direction[0];
        if(txMax < txMin) { 
            tmp = txMax;
            txMax = txMin;
            txMin = tmp;
        }

        let tyMin = (minY - origin[1]) / direction[1];
        let tyMax = (maxY - origin[1]) / direction[1];
        if(tyMax < tyMin) { 
            tmp = tyMax;
            tyMax = tyMin;
            tyMin = tmp;
        }

        let tzMin = (minZ - origin[2]) / direction[2];
        let tzMax = (maxZ - origin[2]) / direction[2];
        if(tzMax < tzMin) { 
            tmp = tzMax;
            tzMax = tzMin;
            tzMin = tmp;
        }
        let axis = [0, 0, 0];

        let tMin = 0;

        if(txMin > tMin)
        {
            tMin = txMin;
            axis = [1, 0, 0];
        }
        if(tyMin > tMin)
        {
            tMin = tyMin;
            axis = [0, 1, 0];
        }
        if(tzMin > tMin)
        {
            tMin = tzMin;
            axis = [0, 0, 1];
        }

        //let tMin = Math.max(txMin, Math.max(tyMin, tzMin));
        let tMax = Math.min(txMax, Math.min(tyMax, tzMax));

        if (tMax < tMin) {
            return false;
        }

        return axis;
    }
    
    get x()
    {
        return this.coords[0];
    }

    get y()
    {
        return this.coords[1];
    }

    get z()
    {
        return this.coords[2];
    }
}