"use strict";
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
        result += "<mo>-</mo>" + constant.Render(true);
    } else {
        for (var i = 1; i < this.children.length; ++i) {
            result += "<mo>+</mo>" + this.children[i].Render(true);
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
        debugOut (DEBUG_LEVEL.DBG, "Add.Simplify.collectTerms", "Skipping term");
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
        debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "m = " + m.toString ());
        m = m.Simplify ();
        debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "m (simplified) = " + m.toString ());
        d.Accumulate (m);
    }
    debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "d = " + d.toString ());
    d = d.Simplify ();
    debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "d (simplified) = " + d.toString ());
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
    return "Cos (" + this.children[0].Render(false) + ")";
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
    return "Sin (" + this.children[0].Render(false) + ")";
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


function Plot ()
{
    this.tag = "display";
    this.width = 480;
    this.height = 360;
    this.margin = [48, 8, 18, 23];
    this.title = null;
    this.xAxisTitle = null;
    this.yAxisTitle = null;

    this.FromGraphData = function (graphData)
    {


        var ComputeOrderOfMagnitude = function (number) {
            number = Math.abs (number);


            var order = 0;
            while (number > 10.0) {
                ++order;
                number /= 10.0;
            }
            while (number < 1) {
                --order;
                number *= 10.0;
            }
            return order;
        };



        var AdjustDomain = function (domain, adjustDelta) {

            var delta = domain[1] - domain[0];
            if (delta > 0) {
                if (adjustDelta) {

                    if (domain[1] != 0) {
                        domain[1] = domain[1] + (delta * 0.01);
                    }
                    if ((domain[0] != 0) && (domain[0] != 1)) {
                        domain[0] = domain[0] - (delta * 0.01);
                    }
                    delta = domain[1] - domain[0];
                }

                var tickOrderOfMagnitude = ComputeOrderOfMagnitude (delta);
                var tryScale = [1.0, 2.0, 2.5, 5.0, 10.0, 20.0, 25.0];
                var tryPrecision = [1, 1, 2, 1, 1, 1, 2];
                var tickDivisorBase = Math.pow (10, tickOrderOfMagnitude - 1);
                var tickDivisorIndex = 0;
                var tickDivisor = tickDivisorBase * tryScale[tickDivisorIndex];
                while ((delta / tickDivisor) > 9) {
                    tickDivisor = tickDivisorBase * tryScale[++tickDivisorIndex];
                }


                domain[0] = Math.floor (domain[0] / tickDivisor) * tickDivisor;
                domain[1] = Math.ceil (domain[1] / tickDivisor) * tickDivisor;
                domain[2] = Math.round ((domain[1] - domain[0]) / tickDivisor);
                domain[3] = tryPrecision[tickDivisorIndex];
            }
            return domain;
        };


        if (this.title) { this.margin[1] += 18; }
        if (this.xAxisTitle) { this.margin[3] += 15; }
        if (this.yAxisTitle) { this.margin[0] += 15; }


        var xDomain = AdjustDomain ([d3.min(graphData, function (d) { return d.x}), d3.max(graphData, function (d) { return d.x})]);
        var yDomain = AdjustDomain ([d3.min(graphData, function (d) { return d.y}), d3.max(graphData, function (d) { return d.y})], true);
        var x = d3.scale.linear().domain([xDomain[0], xDomain[1]]).range([0 + this.margin[0], this.width - this.margin[2]]);
        var y = d3.scale.linear().domain([yDomain[0], yDomain[1]]).range([this.height - this.margin[3], 0 + this.margin[1]]);


        var g = d3.select("#" + this.tag)
            .append("svg")
            .attr("class", "SymbolicMathPlot")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g");


        g.append("rect")
            .attr("fill", "rgba(0, 0, 255, 0.05)")
            .attr("stroke", "rgba(0, 0, 255, 0.1)")
            .attr("width", "100%")
            .attr("height", "100%");


        g.append("path")
            .attr ("d", d3.svg.line()
                .x(function(d, i) { return x(d.x); })
                .y(function(d) { return y(d.y); }) (graphData))
            .attr("stroke", "rgb(128, 0, 0)")
            .attr("stroke-width", 2.0)
            .attr("fill", "none");


        var makeTicks = function (domain) {
            var ticks = [];
            var incr = (domain[1] - domain[0]) / domain[2];
            for (var i = 0; i <= domain[2]; ++i) {
                ticks.push (domain[0] + (i * incr));
            }
            return ticks;
        };


        var xTicks = makeTicks (xDomain);
        var yTicks = makeTicks (yDomain);


        g.selectAll(".xTicks")
            .data(xTicks)
            .enter().append("line").attr("class", "xTicks")
            .attr("x1", function(d) { return x(d); })
            .attr("y1", y(yDomain[0]) + 5)
            .attr("x2", function(d) { return x(d); })
            .attr("y2", y(yDomain[1]))
            .attr("stroke", "rgba(0, 0, 0, 0.20)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "1, 1");

        g.selectAll(".yTicks")
            .data(yTicks)
            .enter().append("line").attr("class", "yTicks")
            .attr("y1", function(d) { return y(d); })
            .attr("x1", x(xDomain[0])-5)
            .attr("y2", function(d) { return y(d); })
            .attr("x2", x(xDomain[1]))
            .attr("stroke", "rgba(0, 0, 0, 0.20)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "1, 1");



        var labelText = function (number, order, precision) {
            var divisor = Math.pow (10, order);
            var value = number / divisor;
            if (value != 0) {
                return value.toFixed(precision).toString () + ((order != 0) ? ("e" + order) : "");
            }
            return 0;
        };


        var xAxisOrderOfMagnitude = ComputeOrderOfMagnitude (xDomain[1]);
        g.selectAll(".xLabel")
            .data(xTicks)
            .enter().append("text").attr("class", "xLabel")
            .text(function(d) { return labelText (d, xAxisOrderOfMagnitude, xDomain[3]); })
            .attr("x", function(d) { return x(d); })
            .attr("y", y(yDomain[0]))

            .attr("dy", 15)
            .attr("fill", "rgba(0, 0, 0, 0.50)")
            .attr("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-size", "9px");

        var yAxisOrderOfMagnitude = ComputeOrderOfMagnitude (yDomain[1]);
        g.selectAll(".yLabel")
            .data(yTicks)
            .enter().append("text").attr("class", "yLabel")
            .text(function(d) { return labelText (d, yAxisOrderOfMagnitude, yDomain[3]); })
            .attr("x", x (xDomain[0]))
            .attr("y", function(d) { return y(d) })
            .attr("dx", -8)
            .attr("dy", 3)
            .attr("fill", "rgba(0, 0, 0, 0.50)")
            .attr("text-anchor", "end")
            .attr("font-family", "Arial")
            .attr("font-size", "9px");


        if (this.title) {
            g.append("text")
                .text(this.title)
                .attr("x", this.width / 2.0)
                .attr("y", 18)
                .attr("fill", "rgba(0, 0, 0, 0.66)")
                .attr("text-anchor", "middle")
                .attr("font-family", "Arial")
                .attr("font-size", "18px");
        }


        if (this.xAxisTitle) {
            g.append("text")
                .text(this.xAxisTitle)
                .attr("x", x((xDomain[0] + xDomain[1]) / 2.0))
                .attr("y", y(yDomain[0]))
                .attr("dy", 30)
                .attr("fill", "rgba(0, 0, 0, 0.66)")
                .attr("text-anchor", "middle")
                .attr("font-family", "Arial")
                .attr("font-weight", "bold")
                .attr("font-size", "12px");
        }

        if (this.yAxisTitle) {
            var ty = y((yDomain[0] + yDomain[1]) / 2);
            g.append ("text")
                .text(this.yAxisTitle)
                .attr("x", 0)
                .attr("y", ty)
                .attr("transform", "translate(10,0) rotate(180,0," + ty + ")")
                .attr("writing-mode", "tb")
                .attr("fill", "rgba(0, 0, 0, 0.66)")
                .attr("text-anchor", "middle")
                .attr("font-family", "Arial")
                .attr("font-weight", "bold")
                .attr("font-size", "12px");
        }
    }
}
function Sampler ()
{
    this.values = {};
    this.domain = ["x", 0, 1];
    this.sampleCount = 10;
    this.maxRecursion = 6;
    this.errorTolerance = 1.0e-3;

    this.Evaluate = function (expr)
    {

        var scope = this;




        var dValues = {};
        dValues[this.domain[0]] = this.domain[1];
        var d1 = expr.D (dValues);




        var evaluateExpr = function (x) {
            scope.values[scope.domain[0]] = x;
            var y = expr.N (scope.values);
            var y1 = d1.N (scope.values);
            return { x : x, y : expr.N (scope.values), y1 : d1.N (scope.values) };
        };
        var evaluateRange = function (a, b, rec) {
            if (rec < scope.maxRecursion) {
                var dydxSampled = (b.y - a.y) / (b.x - a.x);
                var dydxComputed = (a.y1 + b.y1) / 2.0;
                var error = Math.abs ((dydxSampled / dydxComputed) - 1);
                if (error > scope.errorTolerance) {

                    var c = evaluateExpr ((a.x + b.x) / 2.0);
                    return evaluateRange (a, c, rec + 1).concat (evaluateRange (c, b, rec + 1));
                }
            }
            return [b];
        };


        var last = evaluateExpr (this.domain[1]);
        var sampleData = [last];



        var stepSize = (this.domain[2] - this.domain[1]) / this.sampleCount;
        for (var i = 1; i <= this.sampleCount; ++i) {
            var x = this.domain[1] + (stepSize * i);
            var current = evaluateExpr (this.domain[1] + (stepSize * i));
            sampleData = sampleData.concat (evaluateRange (last, current, 0));
            last = current;
        }


        return sampleData;
    };

    this.NSolve = function (expr)
    {






        var dValues = {};
        dValues[this.domain[0]] = this.domain[1];
        var d1 = expr.D (dValues);
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

SM.Plot = function(graphData) {
    new Plot ().FromGraphData (graphData);
};

SM.namedConstants = {
    "&pi;" : 3.1415926535897932385,
    e : 2.718281828459045,
    h : 6.62606957e-34,
    k : 1.3806488e-23,
    c : 2.99792458e+08,
    g : 9.80665
};



var DEBUG_LEVEL = { TRC: 0, DBG: 1, INF: 2, ERR: 3, SLN: 4 }
var globalDebugLevel = DEBUG_LEVEL.DBG;
function debugOut(level, from, msg) {
    if (level >= globalDebugLevel) {
        var debugDiv = document.getElementById("debugOut");
        if (debugDiv != null) {
            debugDiv.innerHTML += from + ": " + msg + "<br />\n";
        }
    }
}
