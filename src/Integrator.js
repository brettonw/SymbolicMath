function Integrator() {
    this.defaultStepCount = 25;
    this.Evaluate = function (y0, derivativeExpr, domain, values) {
        // condition the input
        var dx = domain.hasOwnProperty ("dx") ? domain.dx : ((domain.to - domain.from) / this.defaultStepCount);

        var evaluateWithEulerStep = function (state) {
            /*
            dx = dt * dxdt(x, t);
            t += dt;
            x += dx;
            */
            var nValues = Utility.add(values, domain.x, state.x);
            var dy = derivativeExpr.N(nValues) * dx;
            var y = state.y + dy;
            var x = state.x + dx;
            return { x: x, y: y };
        }

        var evaluateWithMidpointMethod = function (state) {
            /*
            dx1 = dt * dxdt(x, t);
            dx2 = dt * dxdt(x + 0.5 * dx1, t + 0.5 * dt);
            t += dt;
            x += dx2;
            */
            var nValues = Utility.add(values, domain.x, state.x + (0.5 * dx));
            var dy = derivativeExpr.N(nValues) * dx;
            var y = state.y + dy;
            var x = state.x + dx;
            return { x: x, y: y };
        }

        // build the result array with the first sample point in the range
        var evaluateSteps = function (evaluateWith) {
            var last = { x: domain.from, y: y0 };
            var end = domain.to - (dx * 0.5);
            var samples = [];
            samples.push(last);
            while (last.x < end) {
                last = evaluateWith (last);
                samples.push(last);
            }
            return samples;
        }

        // return the result
        var sampleData = evaluateSteps(evaluateWithMidpointMethod);
        return sampleData;
    };

    this.EvaluateFromExpr = function (expr, domain, values) {
        // get the derivatives with respect to the domain
        var d1 = expr.D(Utility.make(domain.x, domain.from));

        // compute the initial values
        var y0 = expr.N(Utility.add(values, domain.x, domain.from));

        // call to the actual worker
        return this.Evaluate(y0, d1, domain, values);
    };
}
