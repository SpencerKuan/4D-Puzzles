import { Controller } from "./Controller.js";
import { frameCount } from "./frameCount.js";
import { GeometryManager } from "./GeometryManager.js";
import { Player } from "./Player.js";

// output element
export let output = document.querySelector("#output");
output.width = window.innerWidth;
output.height = window.innerHeight;

// vertex and fragment shaders 
export var vertex = await fetch("shader.vert").then(x => x.text());
export var fragment = await fetch("shader.frag").then(x => x.text());

// create the renderer
var run = createRayRenderer(output, vertex, fragment);

// location for rotation uniform: {

let rotLoc = run.gl.getUniformLocation(run.program, "u_rot");
let animLoc = run.gl.getUniformLocation(run.program, "u_animate");
let mouseLoc = run.gl.getUniformLocation(run.program, "u_mouse");
let playerLoc = run.gl.getUniformLocation(run.program, "u_player");

let boxesLoc = run.gl.getUniformLocation(run.program, "u_boxes");
export let numBoxesLoc = run.gl.getUniformLocation(run.program, "u_numBoxes");

const maxBoxes = 50;
export const boxLocs = Array(maxBoxes).fill(0).map((_, i) => "u_boxes[" + i + "]").map(x => {
    return {
        pos: run.gl.getUniformLocation(run.program, x + ".pos"),
        color: run.gl.getUniformLocation(run.program, x + ".color"),
        size: run.gl.getUniformLocation(run.program, x + ".size")
    }
});


let curUpdater = mainGame;

// scene variables
let gameController = new Controller({});
gameController.attachTo(document.body);

export let geometryManager = new GeometryManager(run);
let player;


let scenes = [
    {
        boxes: [
            [[0, 0, 0, 40], [20, 1, 20, 80], [1, 1, 1, 1]],
            [[0, 4, 0, 70], [1, 1, 1, 1], [0, 0, 0, 0]],
        ],

        player: [0, 5, 0, 0]
    },

    {
        boxes: [
            [[0, 0, 0, 40], [20, 1, 20, 80], [1, 1, 1, 1]],
            [[0, 0, 0, 40], [20, 20, 5, 20], [1, 1, 1, 1]],
            [[0, 4, 0, 70], [1, 1, 1, 1], [0, 0, 0, 0]],
        ],

        player: [0, 5, 0, 0]
    },
    
    {
        boxes: [
            [[0, 0, 0, 40], [20, 1, 20, 80], [1, 1, 1, 1]],
            [[0, 0, 0, 40], [20, 20, 20, 20], [1, 1, 1, 1]],
            [[0, 0, 5, 40], [20, 1, 20, 40], [1, 1, 1, 1]],
            [[0, 4, 0, 70], [1, 1, 1, 1], [0, 0, 0, 0]],
        ],

        player: [0, 5, 0, 0]
    },

    {
        boxes: [
            [[0, 0, 0, -2.5], [5, 1, 5, 10], [1, 1, 1, 1]],
            [[0, 2, 0, 10], [5, 1, 5, 5], [1, 1, 1, 1]],
            [[0, 4, 0, 20], [5, 1, 5, 5], [1, 1, 1, 1]],
            [[10, 6, 0, 30], [25, 1, 5, 5], [1, 1, 1, 1]],
            [[20, 10, 0, 30], [2, 2, 2, 2], [0, 1, 1, 1]],
        ],

        player: [0, 5, 0, -5]
    },

    {
        boxes: [
            [[0, 0, 0, -2.5], [5, 1, 5, 10], [1, 1, 1, 1]],
            [[0, 2, 0, 10], [5, 1, 5, 5], [1, 1, 1, 1]],
            [[0, 4, 0, 20], [5, 1, 5, 5], [1, 1, 1, 1]],
            [[10, 6, 0, 30], [25, 1, 5, 5], [1, 1, 1, 1]],
            [[20, 10, 0, 30], [2, 2, 2, 2], [0, 1, 1, 1]],
        ],

        player: [0, 5, 0, -5]
    },
];

let sceneIndex = 0;

// debugging only
sceneIndex = scenes.length - 1;

function loadScene(scene) {
    geometryManager.clear();

    scene.boxes.forEach(box => {
        geometryManager.add(...box, [1, 1, 1, 1]);
    });

    player = new Player(scene.player);
    player.onwin = () => {
        

        if (sceneIndex < scenes.length - 1) {
            sceneIndex ++;
            loadScene(scenes[sceneIndex]);
        } else {
            curUpdater = endScreen;
        }
    }

    player.onrestart = () => {
        loadScene(scenes[sceneIndex]);
    }
}

loadScene(scenes[sceneIndex]);


function mainGame() {
    // update animation
    animate += 0.02;

    player.update();
    player.handleInput(gameController, 2);

    // send shader data
    run.gl.uniformMatrix4fv(rotLoc, false, player.getRotMatrix().flat());
    run.gl.uniform1f(animLoc, animate);
    run.gl.uniform2fv(mouseLoc, [0, 0]);
    run.gl.uniform4fv(playerLoc, player.headPos);

    // send box data
    geometryManager.updateUniforms();

    // render the shader
    run.render(Date.now() % 1000000);
}

function endScreen() {
    document.getElementById("level").innerText = "Thanks for playing!";
}

// rendering loop

var id = (parent.id = Math.random());
let animate = 0;

parent.render = function () {
    frameCount.tick();

    // document.getElementById("fps").innerText = frameCount.getSpeed().toFixed(2);
    document.getElementById("level").innerText = `Level ${sceneIndex + 1}`;

    curUpdater();

    gameController.mouseDelta = [0, 0];

    // loop
    if (id === parent.id) requestAnimationFrame(parent.render);
};

// initiate rendering
parent.render();


output.addEventListener("click", async () => {
    console.log("locking!!");
    await output.requestPointerLock();
});
