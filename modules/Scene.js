import { Player } from "./Player.js";
import { output, vertex, fragment } from "./run.js";

class Scene {
    constructor(renderer, uniforms) {
        this.renderer = renderer || createRayRenderer(output, vertex, fragment);
        this.uniforms = uniforms ?? {};
        this.objects = [];

        this.player = new Player();
    }
    addUnifrom(name, type) {
        this.uniforms[name] = {
            location: this.renderer.gl.getUniformLocation(this.renderer.program, "u_" + name),
            type: type,
            value: null
        };
    }
    setUniform(name, value) {
        this.uniforms[name].value = value;
    }
    updateUniforms() {
        for (var key in this.uniforms) {
            var uniform = this.uniforms[key];
            this.renderer.gl[uniform.type](uniform.location, value);
        }
    }
}
