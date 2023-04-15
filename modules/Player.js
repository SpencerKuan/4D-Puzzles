import { identity, rotateXY, rotateYZ, rotateXW, rotateYW, rotateZW, rotateXZ } from "./mat4.js";
import { geometryManager } from "./run.js";

export class Player {
    constructor(pos = [0, 5, 0, 0]) {
        this.rotAccel = [0, 0, 0];
        this.pos = pos;
        this.vel = [0, 0, 0, 0];
        this.rot = [0, 0.3, 0];
        this.rotationMatrix = identity(); 

        this.onGround = false;

        this.size = [2, 4, 2, 2]
        this.height = this.size[1];

        this.onwin = () => {};
        this.onrestart = () => {};
    }

    get headPos() {
        return math.add(this.pos, [0, this.height, 0, 0]);
    }

    update() {
        this.rot = math.add(this.rot, this.rotAccel);

        // gravity 
        this.vel[1] -= 0.08;

        // terminal velocity
        this.vel[1] = Math.max(this.vel[1], -3);

        // dampen rotation
        let friction = 0.3;
        this.rotAccel = this.rotAccel.map(x => x * (1 - friction));

        // dampen velocity
        this.vel = math.multiply(this.vel, 0.9);

        // new position moved in all possible dimensions (this might not be a possible position to actually move)
        let newPosUnchecked = math.add(this.pos, this.vel);
        newPosUnchecked = newPosUnchecked._data ?? newPosUnchecked;

        // move the player in each dimension

        let hitTheEnd = false;

        // x
        var newPos = this.pos.slice();
        newPos[0] = newPosUnchecked[0];

        let xIntersection = geometryManager.boxIntersect(newPos, this.size);
        if (!geometryManager.boxIntersect(newPos, this.size)) {
            this.pos = newPos;
        } else {
            hitTheEnd = hitTheEnd || xIntersection.color[0] === 0;
        }
        

        // y

        this.onGround = false;
        var newPos = this.pos.slice();
        newPos[1] = newPosUnchecked[1];

        let yIntersection = geometryManager.boxIntersect(newPos, this.size);
        if (yIntersection) {
            this.vel[1] = 0;
            this.onGround = true;

            this.pos[1] = yIntersection.pos[1] + yIntersection.size[1] / 2 + this.size[1] / 2;
            hitTheEnd = hitTheEnd || yIntersection.color[0] === 0;
        } else {
            this.pos = newPos;
        }

        if (this.pos[1] < -50) this.onrestart();

        // z
        var newPos = this.pos.slice();
        newPos[2] = newPosUnchecked[2];

        let zIntersection = geometryManager.boxIntersect(newPos, this.size);
        if (!geometryManager.boxIntersect(newPos, this.size)) {
            this.pos = newPos;
        } else {
            hitTheEnd = hitTheEnd || zIntersection.color[0] === 0;
        }

        // w
        var newPos = this.pos.slice();
        newPos[3] = newPosUnchecked[3];

        let wIntersection = geometryManager.boxIntersect(newPos, this.size);
        if (!geometryManager.boxIntersect(newPos, this.size)) {
            this.pos = newPos;
        } else {
            hitTheEnd = hitTheEnd || wIntersection.color[0] === 0;
        }

        if (hitTheEnd) {
            this.onwin();
        }
    }


    getRotMatrix() {
        function clamp(x, a, b){
            return x <= a ? a : (x >= b ? b : x);
        }

        this.rot[0] = clamp(this.rot[0], -Math.PI * 0.5, Math.PI * 0.5);

        let wackyShift = rotateXZ(this.rot[2]); // 4D, wacky rotation
        let leftRight = rotateXW(this.rot[1]); 
        let upDown = rotateYW(this.rot[0]);

        var res = math.multiply(wackyShift, leftRight, upDown)._data;
        return this.rotationMatrix = res;
    }

    move (dir) {
        let rotation = this.getRotMatrix();

        var playerDirection = math.multiply(rotation, dir);
        this.vel = math.add(this.vel, math.multiply(playerDirection, 0.02));
    }

    handleInput(gameController, t) {
        let turnSpeed = 0.02;
        let actions = {
            "u": () => this.rot[2] += turnSpeed,
            "o": () => this.rot[2] -= turnSpeed,
            "i": () => this.rot[0] -= turnSpeed,
            "k": () => this.rot[0] += turnSpeed,
            "j": () => this.rot[1] += turnSpeed,
            "l": () => this.rot[1] -= turnSpeed,

            "q": () => this.move([0, 0, +1 * t, 0]),
            "e": () => this.move([0, 0, -1 * t, 0]),
            "w": () => this.move([0, 0, 0, +1 * t]),
            "s": () => this.move([0, 0, 0, -1 * t]),
            "a": () => this.move([-1 * t, 0, 0, 0]),
            "d": () => this.move([+1 * t, 0, 0, 0]),

            "r": () => this.onrestart(),
        };

        for (var key in actions) {
            if (gameController.pressedKeys.has(key))
                actions[key]();
        }

        this.rot[0] += gameController.mouseDelta[1] * 0.005;
        this.rot[1] -= gameController.mouseDelta[0] * 0.005;
        this.rot[2] += gameController.mouseDelta[2] * 0.05 || 0;

        // jumping 
        if (gameController.pressedKeys.has(" ")) {
            if (this.onGround) {
                this.vel[1] = 2;
                this.onGround = false;
            }
        }
    }


}
