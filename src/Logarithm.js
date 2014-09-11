#define _X  this.children[0]

DERIVE_EXPR_ALIAS(Exp,Function);

Exp.N = function(values) {
    return Math.exp (_X.N(values));
};

Exp.D = function(values) {
    var d =_X.D(values).Multiply (this);
    return d.Simplify ();
};

Exp.Render = function(enclose) {
    //return "Exp (" + _X.Render(false) + ")";
    return "<msup><mi>e</mi>" + _X.Render(false) + "</msup>";
};

DERIVE_EXPR_ALIAS(Log,Function);
Log.N = function(values) {
    return Math.log() (_X.N(values));
};

Log.D = function(values) {
    var d = EXPR(Divide)(1, _X).Multiply (_X.D(values));
    return d.Simplify ();
};

Log.Render = function(enclose) {
    return "Log (" + _X.Render(false) + ")";
};

#undef  _X
