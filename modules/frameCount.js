export var frameCount = (function () {
    var times = [];
    var index = 0;
    var test = 10;

    var cachedSpeed = null;

    return {
        tick: function tick() {
            if (times.length < test) {
                times.push(performance.now());
            } else {
                times[index] = performance.now();
                index = (index + 1) % test;
            }

            cachedSpeed = null;
        },
        getSpeed: function () {
            if (cachedSpeed !== null)
                return cachedSpeed;

            var min = times[0];
            var max = times[0];

            for (var i = 0; i < times.length; i++) {
                if (times[i] < min)
                    min = times[i];
                if (times[i] > max)
                    max = times[i];
            }

            var fps = times.length / (max - min) * 1000;
            return cachedSpeed = fps;
        },
        reset() {
            times = [];
            index = 0;
        }
    };
})();
