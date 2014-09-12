function Integrator() {
    this.values = {};
    this.domain = { name: "x", from: 0.0, to: 1.0, h: 0.1 };

    this.Evaluate = function (y0, derivativeExpr) {
        // scoping access to "this" inside of sub-functions
        var scope = this;

        var evaluateWithEulerStep = function (value, h) {
            var x = value.x + h;
            var dy = derivativeExpr.N(scope.values) * h;
            var y = value.y + dy;
            return { x: x, y: y, dy: dy };
        }

        var evaluateWithMidpointMethod = function (value, h) {

        }

        // build the result array with the first sample point in the range
        var evaluateSteps = function (evaluateWith) {
            var last = { x: scope.domain.from, y: y0, dy: dy0 };
            var samples = [];
            samples.push(last);
            while (last.x <= scope.domain.to) {
                last = evaluateWith (last, scope.domain.h);
                samples.push(last);
            }
            return samples;
        }

        // return the result
        var sampleData = evaluateSteps(evaluateWithEulerStep);
        return sampleData;
    };

    this.EvaluateFromExpr = function (expr) {
        // get the derivatives with respect to the domain
        var dValues = {};
        dValues[this.domain.name] = this.domain.from;
        var d1 = expr.D(dValues);

        // compute the initial values
        this.values[this.domain.name] = this.domain.from;
        var y0 = expr.N(this.values);

        // call to the actual worker
        return this.Evaluate(y0, d1);
    };
}
