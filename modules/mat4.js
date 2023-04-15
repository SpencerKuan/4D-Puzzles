function rotateXY(angle) {
    const s = math.sin(angle);
    const c = math.cos(angle);

    return math.matrix([
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);
}

function rotateXZ(angle) {
    const s = math.sin(angle);
    const c = math.cos(angle);

    return math.matrix([
        [c, 0, -s, 0],
        [0, 1, 0, 0],
        [s, 0, c, 0],
        [0, 0, 0, 1]
    ]);
}

function rotateXW(angle) {
    const s = math.sin(angle);
    const c = math.cos(angle);

    return math.matrix([
        [c, 0, 0, -s],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [s, 0, 0, c]
    ]);
}

function rotateYZ(angle) {
    const s = math.sin(angle);
    const c = math.cos(angle);

    return math.matrix([
        [1, 0, 0, 0],
        [0, c, -s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1]
    ]);
}

function rotateYW(angle) {
    const s = math.sin(angle);
    const c = math.cos(angle);

    return math.matrix([
        [1, 0, 0, 0],
        [0, c, 0, -s],
        [0, 0, 1, 0],
        [0, s, 0, c]
    ]);
}

function rotateZW(angle) {
    const s = math.sin(angle);
    const c = math.cos(angle);

    return math.matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, c, -s],
        [0, 0, s, c]
    ]);
}

function identity() {
    return math.matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);
}


export {
    identity,
    rotateXY,
    rotateXZ,
    rotateXW,
    rotateYZ,
    rotateYW,
    rotateZW,
};
