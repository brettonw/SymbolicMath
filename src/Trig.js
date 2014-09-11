#define _X  this.children[0]

DERIVE_EXPR_ALIAS(Cos,Function);
Cos.N = function(values) {
    return Math.cos (_X.N(values));
};

Cos.D = function(values) {
    var d = _X.D(values).Multiply (EXPR(Sin)(_X)).Multiply (-1);
    return d.Simplify ();
};

Cos.Render = function(enclose) {
    return "<mi>cos</mi><mrow><mo>(</mo>" + _X.Render(false) + "<mo>)</mo></mrow>";
};

DERIVE_EXPR_ALIAS(Sin,Function)
Sin.N = function(values) {
    return Math.sin (_X.N(values));
};

Sin.D = function(values) {
    var d = _X.D(values).Multiply (EXPR(Cos)(_X));
    return d.Simplify ();
};

Sin.Render = function(enclose) {
    return "<mi>sin</mi><mrow><mo>(</mo>" + _X.Render(false) + "<mo>)</mo></mrow>";
};

#undef  _X
