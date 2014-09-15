var Utility = Object.create(null);

Utility.shallowCopy = function (from, to) {
    for (var part in from) {
        if (from.hasOwnProperty(part)) {
            to[part] = from[part];
        }
    }
}

Utility.combine = function (a, b) {
    var ab = Object.create(null);
    Utility.shallowCopy(a, ab);
    Utility.shallowCopy(b, ab);
    return ab;
}

Utility.add = function (a, k, v) {
    var ab = Object.create(null);
    Utility.shallowCopy(a, ab);
    ab[k] = v;
    return ab;
}

Utility.make = function (k, v) {
    var ab = Object.create(null);
    ab[k] = v;
    return ab;
}
