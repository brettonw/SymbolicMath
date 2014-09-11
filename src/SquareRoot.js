#define _RADICAND       this.children[0]

DERIVE_EXPR_ALIAS(Sqrt,Power);

Sqrt.N = function(values) {
    var base = _RADICAND.N(values);
    var sqrt = Math.sqrt (base);
    return sqrt;
};

Sqrt.D = function(values) {
    var d = EXPR(Divide)(1.0, EXPR(Multiply)(2.0, this)).Multiply(_RADICAND.D(values));
    return d.Simplify ();
};

Sqrt.Render = function(enclose) {
    return "<msqrt>" + _RADICAND.Render(false) + "</msqrt>";
};

Sqrt.Simplify = function() {
    var a = _RADICAND.Simplify ();
    
    // special cases
    if (a.typename == "Constant") {
        var sqrt = Math.sqrt (base);
        return EXPR(Constant)(sqrt);
    }
    
    // otherwise just return a new power object
    return EXPR(Sqrt) (a);
};

#undef  _RADICAND
