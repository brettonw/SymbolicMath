#define _NUMERATOR      this.children[0]
#define _DENOMINATOR    this.children[1]

DERIVE_EXPR(Divide);

Divide.N = function(values) {
    return _NUMERATOR.N(values) / _DENOMINATOR.N(values);
};

Divide.D = function(values) {
    // (a/b)' = ((a' b) - (a b')) / b^2
    var d = _NUMERATOR.D(values).Multiply(_DENOMINATOR).Subtract(_NUMERATOR.Multiply(_DENOMINATOR.D(values))).Divide(_DENOMINATOR.Power(2.0));
    return d.Simplify ();
};

Divide.Render = function(enclose) {
    var result = new String();
    //if (enclose) result += "(";
    result += "<mfrac>" + _NUMERATOR.Render(true) + " " + _DENOMINATOR.Render(true) + "</mfrac>";
    //if (enclose) result += ")";
    return result;
};

Divide.Simplify = function() {
    var a = _NUMERATOR.Simplify ();
    var b = _DENOMINATOR.Simplify ();
    
    // collapse constants
    if ((a.typename == "Constant") AND (b.typename == "Constant")) {
        // XXX TODO check that the result is reasonably representable
        var value = a.N (null) / b.N (null);
        return EXPR(Constant)(value);
    }
    
    // if the numerator is a complete term (Multiply node with a Constant), 
    // and the denominator is Constant, move the Division into the Multiply
    if ((a.typename == "Multiply") AND (b.typename == "Constant")) {
        var multiplyChildren = a.children;
        if (multiplyChildren[0].typename == "Constant") {
            multiplyChildren[0] = EXPR(Divide)(multiplyChildren[0], b);
            return a.Simplify ();
        }
    }
    
    // return a new Divide node
    return EXPR(Divide)(a, b);
};

#undef  _NUMERATOR
#undef  _DENOMINATOR
