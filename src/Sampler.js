function Sampler ()
{
    this.minRecursion = 2;          // bisection, so 2^2 = 4
    this.maxRecursion = 12;         // bisection, so 2^11 = 2048
    this.errorToleranceDistance = 1.0e-3;
    this.errorToleranceSlope = 1.0e-3;

    this.Evaluate = function (expr, domain, values)
    {
        // scoping access to "this" inside of sub-functions
        var scope = this;

        // compute the first derivative of the expression with respect to the
        // domain variable, we'll use this to evaluate error during the sampling
        // process
        var d1 = expr.D (Utility.make (domain.x, domain.from));

        // a simple function to evaluate the expression and its derivative
        // at a particular point.
        // returns a sample with all three values
        var evaluateExpr = function (x) {
            var nValues = Utility.add (values, domain.x, x);
            var y = expr.N (nValues);
            var dy = d1.N (nValues);
            return { x : x, y : y, dy : dy };
        };

        // given two samples, A and B, evaluate whether to subdivide the line
        // between them by computing several accuracy metrics:
        //   A) compare the average slope (by examinining the first derivative
        //      at both samples) to the calculated slope at the midpoint.
        //   B) compute the distance from the midpoint sample to the line
        //      between the two samples (in units relative to the line between
        //      the samples).
        // if either of these two metrics is inadequate, then bisect the range
        // and recur on the two resulting ranges.
        // this function returns an array of samples, not including the start
        // of the the range.
        var evaluatePair = function (A, B, rec) {
            if (rec < scope.maxRecursion) {
                // (A) above
                var sampleErrorSlope = function (A, B, C) {
                    // average the computed slope at the end points
                    var dyAverage = (A.dy + B.dy) / 2.0;

                    // compare that to the computed slope
                    var error = Math.abs((C.dy / dyAverage) - 1);
                    DEBUG_OUT (DEBUG_LEVEL.TRC, "Sampler.Evaluate.sampleErrorSlope", ((error > scope.errorToleranceSlope) ? "FAIL" : "pass") + ", error = " + error);
                    return error;
                }

                // (B) above
                var sampleErrorDistance = function (A, B, C) {
                    // compute the line equation
                    var a = -(B.y - A.y);
                    var b = (B.x - A.x);
                    var c = -((a * A.x) + (b * A.y));

                    // compute the distance, relative to the length of AB
                    var d = Math.abs ((a * C.x) + (b * C.y) + c);
                    DEBUG_OUT (DEBUG_LEVEL.TRC, "Sampler.Evaluate.sampleErrorDistance", ((d > scope.errorToleranceDistance) ? "FAIL" : "pass") + ", d = " + d);
                    return d;
                }

                var C = evaluateExpr((A.x + B.x) / 2.0);
                if ((rec < scope.minRecursion) OR (sampleErrorSlope (A, B, C) > scope.errorToleranceSlope) OR (sampleErrorDistance(A, B, C) > scope.errorToleranceDistance)) {
                    var AC = evaluatePair(A, C, rec + 1);
                    var CB = evaluatePair(C, B, rec + 1);
                    var ACB = AC.concat(CB);
                    return ACB;
                }
            }

            // we didn't return a subdivided version of the pair, just return
            // the end of the range
            return [B];
        }

            // recursively split this range as long as the midpoint is far enough
        // off the linear interpolation
        var sampleData = [evaluateExpr(domain.from)];
        sampleData = sampleData.concat (evaluatePair(sampleData[0], evaluateExpr(domain.to), 0));

        // return the result
        return sampleData;
    };

    this.NSolve = function (expr, domain, values)
    {
        // looking for the point(s) where the function is 0, using modified
        // Euler's method, midpoint method (2nd order), or range-kutta methods (4th order)

        // compute the first derivative of the expression with respect to the
        // domain variable, we'll use this to evaluate error during the sampling
        // process
        var d1 = expr.D (Utility.make (domain.x, domain.from));

        // a simple function to evaluate the expression and its derivative
        // at a particular point.
        // returns a sample with all three values
        var evaluateExpr = function (x) {
            var nValues = Utility.add (values, domain.x, x);
            var y = expr.N (nValues);
            var dy = d1.N (nValues);
            return { "x" : x, "y" : y, "dy" : dy };
        };

        var x = domain.from;
        var step = evaluateExpr (x);
        for (var i = 0; i < 7; ++i) {
            // compute the velocity towards 0 (dx/dy), and use that as the step size
            var dx = -(step.y / step.dy);
            DEBUG_OUT (DEBUG_LEVEL.TRC, "Sampler.NSolve", "( x: "+ step.x + ", y: " + step.y + ", dy: " + step.dy + ", dx: " + dx + ")");
            // compute the value and derivative at the beginning of the domain
            var step = evaluateExpr (step.x + dx);
        }

        return step.x;
    };
}
