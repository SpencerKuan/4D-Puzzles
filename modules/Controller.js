export class Controller {
    constructor(actions = {}) {
        this.pressedKeys = new Set();
        this.motion = {
            x: 0,
            y: 0,
            scroll: 0
        };

        this.elements = new Set();
        this.actions = actions;

        this.mouseIsPressed = false;
        this.mouseDelta = [0, 0, 0];
        this.mousePos = [0, 0];
    }

    createEventListeners(element) {
        if (element.__listening) return;

        let listeners = {
            keydown: event => {
                this.pressedKeys.add(event.key);
                if (this.actions[event.key])
                    this.actions[event.key]();
            },
            keyup: event => {
                if (this.pressedKeys.has(event.key)) {
                    this.pressedKeys.delete(event.key);
                }
            },
            onmousedown: () => {
                this.mouseIsPressed = true;
            },
            mouseup: () => {
                this.mouseIsPressed = false,
                this.mouseDelta = [0, 0, 0];
            },
            mouseout: () => {
                this.mouseIsPressed = false,
                this.mouseDelta = [0, 0, 0];
            },
            mousemove: event => {
                this.motion = event;
                this.mousePos = [event.offsetX, event.offsetY];
                [this.mouseDelta[0], this.mouseDelta[1]] = [event.movementX, event.movementY];
            },
            wheel: event => {
                const delta = Math.sign(event.deltaY);
                this.mouseDelta[2] = delta;
            }
        };

        element.__listeners = [];
        for(var key in listeners) {
            let listener = element.addEventListener(key, listeners[key]);
            element.__listeners.push(listener);
        }

        element.__listening = true;
    }

    destroyEventListeners(element) {
        element.removeEventListener("keydown", element.__listeners[0]);
        element.removeEventListener("keyup", element.__listeners[1]);
        element.removeEventListener("mousemove", element.__listeners[2]);

        element.__listening = false;
    }

    attachTo(element) {
        if (this.elements.has(element)) return;
        this.elements.add(element);
        this.createEventListeners(element);
    }

    detachFrom(element) {
        if (!this.elements.has(element)) return;
        this.elements.delete(element);
        this.destroyEventListeners(element);
    }

    bindAction(key, action) {
        this.actions[key] = action;
    }
}


