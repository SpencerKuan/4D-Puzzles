import { boxLocs, numBoxesLoc } from "./run.js";

// }
export class GeometryManager {
    constructor(run) {
        this.run = run;
        this.geometries = [];
    }
    clear() {
        this.geometries = [];
    }
    add(pos, size, color) {
        var res = ({
            pos: pos,
            size: size,
            color: color
        });

        this.geometries.push(res);
        return res;
    }
    updateUniforms() {
        this.geometries.forEach((geometry, i) => {
            this.run.gl.uniform4fv(boxLocs[i].pos, geometry.pos);
            this.run.gl.uniform4fv(boxLocs[i].size, geometry.size);
            this.run.gl.uniform4fv(boxLocs[i].color, geometry.color);
        });

        this.run.gl.uniform1i(numBoxesLoc, this.geometries.length);
    }

    // test for intersection with a box and the scene
    boxIntersect(pos, size) {
        var intersection = false;

        for (var i = 0; i < this.geometries.length; i++) {
            var geometry = this.geometries[i];

            // caluculate intersection of two centered boxes
            if (Math.abs(pos[0] - geometry.pos[0]) < (size[0] + geometry.size[0]) / 2 &&
                Math.abs(pos[1] - geometry.pos[1]) < (size[1] + geometry.size[1]) / 2 &&
                Math.abs(pos[2] - geometry.pos[2]) < (size[2] + geometry.size[2]) / 2 &&
                Math.abs(pos[3] - geometry.pos[3]) < (size[3] + geometry.size[3]) / 2) {

                intersection = geometry;
            }
        }

        return intersection;
    }
}
