var Expr = Object.create(null);

Expr.MakeExpr = function(a) {
    var typeofa = typeof(a);
    if ((typeofa == "object") AND ("MakeExpr" in a)) {
        // this is already an expression object
        return a;
    } else if (typeofa == "string") {
        if (Number (a).toString () == a) {
            // it came in as a string, but it's really a number
            return EXPR(Constant)(Number (a));
        } else {
            // make this into a variable
            return EXPR(Variable)(a);
        }
    } else if (typeofa == "number") {
        // make this into a constant
        return EXPR(Constant)(a);
    }

    // WTF did you do?
    return null;
};

Expr.Accumulate = function(a) {
    // accumulate the results as either an array or an object
    var typeofa = Object.prototype.toString.call (a);
    if ((typeofa == "[object Array]") OR (typeofa == "[object Arguments]")) {
        for (var i = 0; i < a.length; i++) {
            this.children.push (this.MakeExpr (a[i]));
        }
    } else {
        this.children.push (this.MakeExpr (a));
    }

    // sort the result
    var typeofSortArray = Object.prototype.toString.call (this.SortArray);
    if (typeofSortArray == "[object Function]") {
        this.SortArray (this.children);
    }
    
    return this;
};

Expr.Add        = function(a) { return EXPR(Add)(this, a); };
Expr.Subtract   = function(a) { return EXPR(Add)(this, EXPR(Multiply) (-1, a)); };
Expr.Multiply   = function(a) { return EXPR(Multiply)(this, a); };
Expr.Divide     = function(a) { return EXPR(Divide)(this, a); };
Expr.Power      = function(a) { return EXPR(Power)(this, a); };

Expr.toString = function() {
    // child objects must define "Render"
    return "<math xmlns=\"http://www.w3.org/1998/Math/MathML\">" + this.Render (false) + "</math>";
};

Expr.Simplify = function() {
    // default implementation just returns this, no simplification
    return this;
};

Expr._init = function() {
    // unless we say otherwise, expressions will gather their arguments into
    // an array of expressions
    this.children = [];
    
    // if the incoming argument is just an array or another "arguments"
    // object, we want to pass that instead
    var args = arguments;
    if (args.length == 1) {
        var argType = Object.prototype.toString.call (args[0]);
        if ((argType == "[object Arguments]") OR (argType == "[object Array]")) {
            args = args[0];
        }
    }
    this.Accumulate (args);
    return this;
};
