var SVG = Object.create(null);

SVG.shallowCopy = function (from, to) {
    for (var part in from) {
        if (from.hasOwnProperty(part)) {
            to[part] = from[part];
        }
    }
}

SVG.combine = function (a, b) {
    var ab = Object.create(null);
    Utility.shallowCopy(a, ab);
    Utility.shallowCopy(b, ab);
    return ab;
}

SVG.add = function (a, k, v) {
    var ab = Object.create(null);
    Utility.shallowCopy(a, ab);
    ab[k] = v;
    return ab;
}

SVG.make = function (k, v) {
    var ab = Object.create(null);
    ab[k] = v;
    return ab;
}

