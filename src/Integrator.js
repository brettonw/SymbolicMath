function Integrator() {
    this.values = {};
    this.domain = { name: "x", from: 0.0, to: 1.0, h: 0.1 };

    this.Evaluate = function (y0, derivativeExpr) {
        // scoping access to "this" inside of sub-functions
        var scope = this;

        var evaluateWithEulerStep = function (value, h) {
            /*
            dx = dt * dxdt(x, t);
            t += dt;
            x += dx;
            */
            var values = Utility.add(scope.values, scope.domain.name, value.x);
            var dy = derivativeExpr.N(values) * h;
            var y = value.y + dy;
            var x = value.x + h;
            return { x: x, y: y };
        }

        var evaluateWithMidpointMethod = function (value, h) {
            /*
            dx1 = dt * dxdt(x, t);
            dx2 = dt * dxdt(x + 0.5 * dx1, t + 0.5 * dt);
            t += dt;
            x += dx2;
            */
            //var dy1 = derivativeExpr.N(scope.values) * h;
            scope.values[scope.domain.name] = value.x + 0.5 * h;
            var dy = derivativeExpr.N(scope.values) * h;
            var y = value.y + dy;
            var x = value.x + h;
            return { x: x, y: y };
        }

        // build the result array with the first sample point in the range
        var evaluateSteps = function (evaluateWith) {
            var last = { x: scope.domain.from, y: y0 };
            var samples = [];
            samples.push(last);
            while (last.x < scope.domain.to) {
                last = evaluateWith (last, scope.domain.h);
                samples.push(last);
            }
            return samples;
        }

        // return the result
        var sampleData = evaluateSteps(evaluateWithMidpointMethod);
        return sampleData;
    };

    this.EvaluateFromExpr = function (expr) {
        // get the derivatives with respect to the domain
        var dValues = Utility.add({}, this.domain.name, this.domain.from);
        var d1 = expr.D(dValues);

        // compute the initial values
        var values = Utility.add(this.values, this.domain.name, this.domain.from);
        var y0 = expr.N(values);

        // call to the actual worker
        return this.Evaluate(y0, d1);
    };
}
