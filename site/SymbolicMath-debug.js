"use strict";
var DEBUG_LEVEL = { TRC: 0, DBG: 1, INF: 2, ERR: 3, SLN: 4 }
var globalDebugLevel = DEBUG_LEVEL.DBG;
function debugOut(from, msg) {
    var output = from + ": " + msg;
    var debugDiv = document.getElementById("debugOut");
    if (debugDiv != null) {
        debugDiv.innerHTML += from + ": " + msg + "<br />\n";
    }
    console.log(output);
}
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
var Expr = Object.create(null);
Expr.MakeExpr = function(a) {
    var typeofa = typeof(a);
    if ((typeofa == "object") && ("MakeExpr" in a)) {
        return a;
    } else if (typeofa == "string") {
        if (Number (a).toString () == a) {
            return Object.create(Constant)._init(Number (a));
        } else {
            return Object.create(Variable)._init(a);
        }
    } else if (typeofa == "number") {
        return Object.create(Constant)._init(a);
    }
    return null;
};
Expr.Accumulate = function(a) {
    var typeofa = Object.prototype.toString.call (a);
    if ((typeofa == "[object Array]") || (typeofa == "[object Arguments]")) {
        for (var i = 0; i < a.length; i++) {
            this.children.push (this.MakeExpr (a[i]));
        }
    } else {
        this.children.push (this.MakeExpr (a));
    }
    var typeofSortArray = Object.prototype.toString.call (this.SortArray);
    if (typeofSortArray == "[object Function]") {
        this.SortArray (this.children);
    }
    return this;
};
Expr.Add = function(a) { return Object.create(Add)._init(this, a); };
Expr.Subtract = function(a) { return Object.create(Add)._init(this, Object.create(Multiply)._init (-1, a)); };
Expr.Multiply = function(a) { return Object.create(Multiply)._init(this, a); };
Expr.Divide = function(a) { return Object.create(Divide)._init(this, a); };
Expr.Power = function(a) { return Object.create(Power)._init(this, a); };
Expr.toString = function() {
    return "<math xmlns=\"http://www.w3.org/1998/Math/MathML\">" + this.Render (false) + "</math>";
};
Expr.Simplify = function() {
    return this;
};
Expr._init = function() {
    this.children = [];
    var args = arguments;
    if (args.length == 1) {
        var argType = Object.prototype.toString.call (args[0]);
        if ((argType == "[object Arguments]") || (argType == "[object Array]")) {
            args = args[0];
        }
    }
    this.Accumulate (args);
    return this;
};
var Constant = Object.create(Expr, { typename : { value : "Constant", writable : false, configurable : false, enumerable : true }});
Constant.N = function(values) {
    return this.constant;
};
Constant.D = function(values) {
    return Object.create(Constant)._init(0);
};
Constant.Render = function (enclose) {
    var re = /^([^e]*)e?([^e]*)$/;
    var matched = re.exec(this.constant.toString());
    var result = "<mn>" + matched[1] + "</mn>";
    if (matched[2].length > 0) {
        result += "<mo>&times;</mo><msup><mn>10</mn><mn>" + matched[2] + "</mn></msup>";
    }
    return result;
};
Constant._init = function() {
    this.constant = arguments[0];
    return this;
};
var Variable = Object.create(Expr, { typename : { value : "Variable", writable : false, configurable : false, enumerable : true }});
Variable.N = function(values) {
    return (this.variable in values) ? values[this.variable] :
           (this.variable in SM.namedConstants) ? SM.namedConstants[this.variable] :
           0;
};
Variable.D = function(values) {
    return Object.create(Constant)._init((this.variable in values) ? 1 : 0);
};
Variable.Render = function(enclose) {
    return "<mi>" + this.variable + "</mi>";
};
Variable._init = function() {
    this.variable = arguments[0];
    return this;
};
var Add = Object.create(Expr, { typename : { value : "Add", writable : false, configurable : false, enumerable : true }});
Add.SortArray = function(array) {
    var sortOrder = { Power:1, Multiply:2, Divide:3, Variable:4, Function:5, Constant:6, Add:7 };
    return array.sort (function (left, right) {
        return sortOrder[left.typename] - sortOrder[right.typename];
    });
    return array;
};
Add.N = function(values) {
    var value = this.children[0].N(values);
    for (var i = 1; i < this.children.length; ++i) {
        value += this.children[i].N(values);
    }
    return value;
};
Add.D = function(values) {
    var d = Object.create(Add)._init();
    for (var i = 0; i < this.children.length; ++i) {
        d.Accumulate (this.children[i].D (values));
    }
    return d.Simplify ();
};
Add.Render = function(enclose) {
    var result = new String("<mrow>");
    if (enclose) result += "<mo>(</mo>";
    result += this.children[0].Render(true);
    if ((this.children.length == 2) && (this.children[1].typename == "Constant") && (this.children[1].constant < 0)) {
        var constant = Object.create(Constant)._init (-this.children[1].constant);
        result += "<mo>&#x2212;</mo>" + constant.Render(true);
    } else {
        for (var i = 1; i < this.children.length; ++i) {
            result += "<mo>&#x002b;</mo>" + this.children[i].Render(true);
        }
    }
    if (enclose) result += "<mo>)</mo>";
    return result + "</mrow>";
};
Add.Simplify = function() {
    var simplifyChildren = function (children) {
        var simplifiedChildren = [];
        for (var i = 0; i < children.length; ++i) {
            var simplifiedChild = children[i].Simplify ();
            simplifiedChildren.push (simplifiedChild);
        }
        return simplifiedChildren;
    }
    var newChildren = simplifyChildren (this.children);
    var levelAddition = function (children) {
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Add") {
                children.splice (i, 1);
                for (var j = 0; j < child.children.length; ++j) {
                    var newChild = child.children[j];
                    children.push (newChild);
                }
            } else {
                ++i;
            }
        }
    }
    levelAddition (newChildren);
    var collapseConstants = function (children) {
        var constantValue = 0;
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Constant") {
                children.splice (i, 1);
                constantValue += child.constant;
            } else {
                ++i;
            }
        }
        if (constantValue == 0) {
            if (children.length == 0) {
                children.push (Object.create(Constant)._init(0));
            }
        } else {
            children.push (Object.create(Constant)._init(constantValue));
        }
    }
    collapseConstants (newChildren);
    var collectTerms = function(children) {
        var terms = {};
        var addTerm = function (variable, exponent, value) {
            if (! (variable in terms)) { terms[variable] = {}; }
            var term = terms[variable];
            term[exponent] = (exponent in term) ? (term[exponent] + value) : value;
        };
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Variable") {
                addTerm (child.variable, 1, 1);
                children.splice (i, 1);
            } else if (child.typename == "Multiply") {
                if ((child.children[0].typename == "Constant") && (child.children[1].typename == "Variable")) {
                    addTerm (child.children[1].variable, 1, child.children[0].constant);
                    children.splice (i, 1);
                } else if ((child.children[0].typename == "Constant") && (child.children[1].typename == "Power")) {
                    var power = child.children[1];
                    if ((power.children[0].typename == "Variable") && (power.children[1].typename == "Constant")) {
                        addTerm (power.children[0].variable, power.children[1].constant, child.children[0].constant);
                        children.splice (i, 1);
                    } else {
                        ++i;
                    }
                } else {
        if (DEBUG_LEVEL.DBG >= globalDebugLevel) { debugOut ("Add.Simplify.collectTerms", "Skipping term"); };
                    ++i;
                }
            } else if (child.typename == "Power") {
                if ((child.children[0].typename == "Variable") && (child.children[1].typename == "Constant")) {
                    addTerm (child.children[0].variable, child.children[1].constant, 1);
                    children.splice (i, 1);
                } else {
                    ++i;
                }
            } else {
                ++i;
            }
        }
        for (var term in terms) {
            var termsExp = terms[term];
            for (var exponent in termsExp) {
                var value = termsExp[exponent];
                var newTerm = Object.create(Multiply)._init(value, Object.create(Power)._init(term, exponent)).Simplify ();
                children.push (newTerm);
            }
        }
    }
    if (newChildren.length == 1) {
        return newChildren[0];
    }
    return Object.create(Add)._init(newChildren);
}
var Multiply = Object.create(Expr, { typename : { value : "Multiply", writable : false, configurable : false, enumerable : true }});
Multiply.SortArray = function(array) {
    var sortOrder = { Constant:1, Divide:2, Add:3, Variable:4, Power:5, Function:6, Multiply:7 };
    return array.sort (function (left, right) {
        return sortOrder[left.typename] - sortOrder[right.typename];
    });
    return array;
};
Multiply.N = function(values) {
    var value = this.children[0].N(values);
    var count = this.children.length;
    for (var i = 1; i < count; ++i)
    {
        value *= this.children[i].N(values);
    }
    return value;
};
Multiply.D = function(values) {
    var d = Object.create(Add)._init();
    var count = this.children.length;
    for (var i = 0; i < count; ++i)
    {
        var m = Object.create(Multiply)._init();
        for (var j = 0; j < count; ++j)
        {
            var term = (i == j) ? this.children[j].D(values) : this.children[j];
            m.Accumulate (term);
        }
        if (DEBUG_LEVEL.DBG >= globalDebugLevel) { debugOut ("Multiply.D", "m = " + m.toString ()); };
        m = m.Simplify ();
        if (DEBUG_LEVEL.DBG >= globalDebugLevel) { debugOut ("Multiply.D", "m (simplified) = " + m.toString ()); };
        d.Accumulate (m);
    }
    if (DEBUG_LEVEL.DBG >= globalDebugLevel) { debugOut ("Multiply.D", "d = " + d.toString ()); };
    d = d.Simplify ();
    if (DEBUG_LEVEL.DBG >= globalDebugLevel) { debugOut ("Multiply.D", "d (simplified) = " + d.toString ()); };
    return d;
};
Multiply.Render = function(enclose) {
    var result = new String("<mrow>");
    result += this.children[0].Render(true);
    var count = this.children.length;
    for (var i = 1; i < count; ++i)
    {
        result += "<mo>&#x2009;</mo>" + this.children[i].Render(true);
    }
    return result + "</mrow>";
};
Multiply.Simplify = function() {
    var simplifyChildren = function (children) {
        var simplifiedChildren = [];
        for (var i = 0; i < children.length; ++i) {
            var simplifiedChild = children[i].Simplify ();
            simplifiedChildren.push (simplifiedChild);
        }
        return simplifiedChildren;
    }
    var newChildren = simplifyChildren (this.children);
    var levelMultiplication = function (children) {
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Multiply") {
                children.splice (i, 1);
                for (var j = 0; j < child.children.length; ++j) {
                    var newChild = child.children[j];
                    children.push (newChild);
                }
            } else {
                ++i;
            }
        }
    }
    levelMultiplication (newChildren);
    var collapseConstants = function (children) {
        var constantValue = 1;
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Constant") {
                children.splice (i, 1);
                constantValue *= child.constant;
            } else {
                ++i;
            }
        }
        if (constantValue == 1) {
            if (children.length == 0) {
                children.push (Object.create(Constant)._init(1));
            }
        } else if (constantValue == 0) {
            children.length = 0;
            children.push (Object.create(Constant)._init(0));
        } else {
            children.push (Object.create(Constant)._init(constantValue));
        }
    }
    collapseConstants (newChildren);
    var collectTerms = function (children) {
        var terms = {};
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Variable") {
                terms[child.variable] = (child.variable in terms) ? (terms[child.variable] + 1) : 1;
                children.splice (i, 1);
            } else if (child.typename == "Power") {
                if ((child.children[0].typename == "Variable") &&- (child.children[1].typename == "Constant")) {
                    if (child.children[0].variable in terms) {
                        terms[child.children[0].variable] = terms[child.children[0].variable] + child.children[1].constant;
                    } else {
                        terms[child.children[0].variable] = child.children[1].constant;
                    }
                    children.splice (i, 1);
                } else {
                    ++i;
                }
            } else {
                ++i;
            }
        }
        for (var term in terms) {
            children.push (Object.create(Power)._init(term, terms[term]).Simplify ());
        }
    }
    collectTerms (newChildren);
    var transformDivision = function (children) {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.typename == "Divide") {
                children.splice (i, 1);
                children.push (child.children[0]);
                var newMultiply = Object.create(Multiply)._init(children);
                var newDivide = Object.create(Divide)._init(newMultiply, child.children[1]);
                children.length = 0;
                children.push (newDivide.Simplify ());
                return;
            }
        }
    }
    transformDivision (newChildren);
    if (newChildren.length == 1) {
        return newChildren[0];
    }
    return Object.create(Multiply)._init(newChildren);
};
var Power = Object.create(Expr, { typename : { value : "Power", writable : false, configurable : false, enumerable : true }});
Power.N = function(values) {
    var base = this.children[0].N(values);
    var exponent = this.children[1].N(values);
    var power = Math.pow (base, exponent);
    return power;
};
Power.D = function(values) {
    var d = this.children[1].Multiply (this.children[0].Power (this.children[1].Subtract(1))).Multiply(this.children[0].D(values));
    return d.Simplify ();
};
Power.Render = function(enclose) {
    var result = new String();
    result += "<msup>" + this.children[0].Render(true) + " " + this.children[1].Render(true) + "</msup>";
    return result;
};
Power.Simplify = function() {
    var a = this.children[0].Simplify ();
    var b = this.children[1].Simplify ();
    if (b.typename == "Constant") {
        var bn = b.constant;
        if (bn == 0) {
            return Object.create(Constant)._init(1);
        } else if (bn == 1) {
            return a;
        }
    }
    if (a.typename == "Constant") {
        var an = a.constant;
        if (an == 0) {
            return Object.create(Constant)._init(0);
        } else if (an == 1) {
            return Object.create(Constant)._init(1);
        }
        if (b.typename == "Constant") {
            var bn = b.constant;
            var pow = Math.pow (an, bn);
            if (Math.abs (pow) < 1000) {
                return Object.create(Constant)._init(pow);
            }
        }
    }
    return Object.create(Power)._init(a, b);
};
var Sqrt = Object.create(Expr, { typename : { value : "Power", writable : false, configurable : false, enumerable : true }});
Sqrt.N = function(values) {
    var base = this.children[0].N(values);
    var sqrt = Math.sqrt (base);
    return sqrt;
};
Sqrt.D = function(values) {
    var d = Object.create(Divide)._init(1.0, Object.create(Multiply)._init(2.0, this)).Multiply(this.children[0].D(values));
    return d.Simplify ();
};
Sqrt.Render = function(enclose) {
    return "<msqrt>" + this.children[0].Render(false) + "</msqrt>";
};
Sqrt.Simplify = function() {
    var a = this.children[0].Simplify ();
    if (a.typename == "Constant") {
        var sqrt = Math.sqrt (base);
        return Object.create(Constant)._init(sqrt);
    }
    return Object.create(Sqrt)._init (a);
};
var Divide = Object.create(Expr, { typename : { value : "Divide", writable : false, configurable : false, enumerable : true }});
Divide.N = function(values) {
    return this.children[0].N(values) / this.children[1].N(values);
};
Divide.D = function(values) {
    var d = this.children[0].D(values).Multiply(this.children[1]).Subtract(this.children[0].Multiply(this.children[1].D(values))).Divide(this.children[1].Power(2.0));
    return d.Simplify ();
};
Divide.Render = function(enclose) {
    var result = new String();
    result += "<mfrac>" + this.children[0].Render(true) + " " + this.children[1].Render(true) + "</mfrac>";
    return result;
};
Divide.Simplify = function() {
    var a = this.children[0].Simplify ();
    var b = this.children[1].Simplify ();
    if ((a.typename == "Constant") && (b.typename == "Constant")) {
        var value = a.N (null) / b.N (null);
        return Object.create(Constant)._init(value);
    }
    if ((a.typename == "Multiply") && (b.typename == "Constant")) {
        var multiplyChildren = a.children;
        if (multiplyChildren[0].typename == "Constant") {
            multiplyChildren[0] = Object.create(Divide)._init(multiplyChildren[0], b);
            return a.Simplify ();
        }
    }
    return Object.create(Divide)._init(a, b);
};
var Cos = Object.create(Expr, { typename : { value : "Function", writable : false, configurable : false, enumerable : true }});
Cos.N = function(values) {
    return Math.cos (this.children[0].N(values));
};
Cos.D = function(values) {
    var d = this.children[0].D(values).Multiply (Object.create(Sin)._init(this.children[0])).Multiply (-1);
    return d.Simplify ();
};
Cos.Render = function(enclose) {
    return "<mi>cos</mi><mrow><mo>(</mo>" + this.children[0].Render(false) + "<mo>)</mo></mrow>";
};
var Sin = Object.create(Expr, { typename : { value : "Function", writable : false, configurable : false, enumerable : true }})
Sin.N = function(values) {
    return Math.sin (this.children[0].N(values));
};
Sin.D = function(values) {
    var d = this.children[0].D(values).Multiply (Object.create(Cos)._init(this.children[0]));
    return d.Simplify ();
};
Sin.Render = function(enclose) {
    return "<mi>sin</mi><mrow><mo>(</mo>" + this.children[0].Render(false) + "<mo>)</mo></mrow>";
};
var Exp = Object.create(Expr, { typename : { value : "Function", writable : false, configurable : false, enumerable : true }});
Exp.N = function(values) {
    return Math.exp (this.children[0].N(values));
};
Exp.D = function(values) {
    var d =this.children[0].D(values).Multiply (this);
    return d.Simplify ();
};
Exp.Render = function(enclose) {
    return "<msup><mi>e</mi>" + this.children[0].Render(false) + "</msup>";
};
var Log = Object.create(Expr, { typename : { value : "Function", writable : false, configurable : false, enumerable : true }});
Log.N = function(values) {
    return Math.log() (this.children[0].N(values));
};
Log.D = function(values) {
    var d = Object.create(Divide)._init(1, this.children[0]).Multiply (this.children[0].D(values));
    return d.Simplify ();
};
Log.Render = function(enclose) {
    return "Log (" + this.children[0].Render(false) + ")";
};
function Sampler ()
{
    this.minRecursion = 2;
    this.maxRecursion = 12;
    this.errorToleranceDistance = 1.0e-3;
    this.errorToleranceSlope = 1.0e-3;
    this.Evaluate = function (expr, domain, values)
    {
        var scope = this;
        var d1 = expr.D (Utility.make (domain.x, domain.from));
        var evaluateExpr = function (x) {
            var nValues = Utility.add (values, domain.x, x);
            var y = expr.N (nValues);
            var dy = d1.N (nValues);
            return { x : x, y : y, dy : dy };
        };
        var evaluatePair = function (A, B, rec) {
            if (rec < scope.maxRecursion) {
                var sampleErrorSlope = function (A, B, C) {
                    var dyAverage = (A.dy + B.dy) / 2.0;
                    var error = Math.abs((C.dy / dyAverage) - 1);
                    if (DEBUG_LEVEL.TRC >= globalDebugLevel) { debugOut ("Sampler.Evaluate.sampleErrorSlope", ((error > scope.errorToleranceSlope) ? "FAIL" : "pass") + ", error = " + error); };
                    return error;
                }
                var sampleErrorDistance = function (A, B, C) {
                    var a = -(B.y - A.y);
                    var b = (B.x - A.x);
                    var c = -((a * A.x) + (b * A.y));
                    var d = Math.abs ((a * C.x) + (b * C.y) + c);
                    if (DEBUG_LEVEL.TRC >= globalDebugLevel) { debugOut ("Sampler.Evaluate.sampleErrorDistance", ((d > scope.errorToleranceDistance) ? "FAIL" : "pass") + ", d = " + d); };
                    return d;
                }
                var C = evaluateExpr((A.x + B.x) / 2.0);
                if ((rec < scope.minRecursion) || (sampleErrorSlope (A, B, C) > scope.errorToleranceSlope) || (sampleErrorDistance(A, B, C) > scope.errorToleranceDistance)) {
                    var AC = evaluatePair(A, C, rec + 1);
                    var CB = evaluatePair(C, B, rec + 1);
                    var ACB = AC.concat(CB);
                    return ACB;
                }
            }
            return [B];
        }
        var sampleData = [evaluateExpr(domain.from)];
        sampleData = sampleData.concat (evaluatePair(sampleData[0], evaluateExpr(domain.to), 0));
        return sampleData;
    };
    this.NSolve = function (expr, domain, values)
    {
        var d1 = expr.D (Utility.make (domain.x, domain.from));
    };
}
function Integrator() {
    this.defaultStepCount = 25;
    this.Evaluate = function (y0, derivativeExpr, domain, values) {
        var dx = domain.hasOwnProperty ("dx") ? domain.dx : ((domain.to - domain.from) / this.defaultStepCount);
        var evaluateWithEulerStep = function (state) {
            var nValues = Utility.add(values, domain.x, state.x);
            var dy = derivativeExpr.N(nValues) * dx;
            var y = state.y + dy;
            var x = state.x + dx;
            return { x: x, y: y };
        }
        var evaluateWithMidpointMethod = function (state) {
            var nValues = Utility.add(values, domain.x, state.x + (0.5 * dx));
            var dy = derivativeExpr.N(nValues) * dx;
            var y = state.y + dy;
            var x = state.x + dx;
            return { x: x, y: y };
        }
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
        var sampleData = evaluateSteps(evaluateWithEulerStep);
        return sampleData;
    };
    this.EvaluateFromExpr = function (expr, domain, values) {
        var d1 = expr.D(Utility.make(domain.x, domain.from));
        var y0 = expr.N(Utility.add(values, domain.x, domain.from));
        return this.Evaluate(y0, d1, domain, values);
    };
}
var SM = Object.create(null);
SM.Expr = function(a) {
    return Expr.MakeExpr(a);
};
SM.Add = function() {
    return Object.create(Add)._init(arguments);
};
SM.Subtract = function(a, b) {
    return this.Add (a, this.Multiply (-1, b));
};
SM.Multiply = function() {
    return Object.create(Multiply)._init(arguments);
};
SM.Divide = function(a, b) {
    return Object.create(Divide)._init(a, b);
};
SM.Power = function(a, b) {
    return Object.create(Power)._init(a, b);
};
SM.Sqrt = function(a) {
    return Object.create(Sqrt)._init(a);
};
SM.Cosine = function(a) {
    return Object.create(Cos)._init(a);
};
SM.Sine = function(a) {
    return Object.create(Sin)._init(a);
};
SM.Tangent = function(a) {
    return this.Divide (this.Sine (a), this.Cosine (a));
};
SM.Exp = function(a) {
    return Object.create(Exp)._init(a);
};
SM.Log = function(a) {
    return Object.create(Log)._init(a);
};
SM.namedConstants = {
    "&pi;" : Math.PI,
    e : Math.E,
    h : 6.62606957e-34,
    k : 1.3806488e-23,
    c : 2.99792458e+08,
    g : 9.80665
};
