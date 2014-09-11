function Integrator() {
    this.values = {};
    this.domain = { name: "x", from: 0.0, to: 1.0 };
    this.sampleCount = 8;

    this.Evaluate = function (expr) {
        // scoping access to "this" inside of sub-functions
        var scope = this;

        // compute the first derivative of the expression with respect to the
        // domain variable, we'll use this to evaluate error during the sampling
        // process
        var dValues = {};
        dValues[this.domain.name] = this.domain.from;
        var d1 = expr.D(dValues);

        // a simple function to evaluate the expression and its derivative
        // at a particular point.
        // returns a sample with all three values
        var evaluateExpr = function (x) {
            scope.values[scope.domain.name] = x;
            var y = expr.N(scope.values);
            var y1 = d1.N(scope.values);
            return { x: x, y: y, y1: y1 };
        };

        // given a range of two samples, a and b, compute the slope between
        // the two samples by simple subtraction, and compare that against
        // the average slope calculated by examining the first derivative at
        // both samples. If the difference between these two is too great,
        // then bisect the range and recur on the two resulting ranges. 
        // returns an array of samples, not including the beginning of the
        // the range. Note that areas of very high slope may result in 
        // numerical inaccuracy that throw this off
        var evaluateRange = function (a, b, rec) {
            if (rec < scope.maxRecursion) {
                var dydxSampled = (b.y - a.y) / (b.x - a.x);
                var dydxComputed = (a.y1 + b.y1) / 2.0;
                var error = Math.abs((dydxSampled / dydxComputed) - 1);
                if (error > scope.errorTolerance) {
                    // add a new sample in the middle, accumulate the results
                    var c = evaluateExpr((a.x + b.x) / 2.0);
                    return evaluateRange(a, c, rec + 1).concat(evaluateRange(c, b, rec + 1));
                }
            }
            return [b];
        };

        // build the result array with the first sample point in the range
        var last = evaluateExpr(this.domain.from);
        var sampleData = [last];

        // the expression is sampled at uniform intervals, and each region
        // is evaluated and subdivided if necessary
        var stepSize = (this.domain.to - this.domain.from) / this.sampleCount;
        for (var i = 1; i <= this.sampleCount; ++i) {
            var x = this.domain.from + (stepSize * i);
            var current = evaluateExpr(x);
            sampleData = sampleData.concat(evaluateRange(last, current, 0));
            last = current;
        }

        // return the result
        return sampleData;
    };

    this.NSolve = function (expr) {
        // looking for the point(s) where the function is 0, using modified
        // Euler's method

        // compute the first derivative of the expression with respect to the
        // domain variable, we'll use this to evaluate error during the sampling
        // process
        var dValues = {};
        dValues[this.domain.name] = this.domain.from;
        var d1 = expr.D(dValues);
    };
}
