#define _BASE       this.children[0]
#define _EXPONENT   this.children[1]

DERIVE_EXPR(Power);

Power.N = function(values) {
    var base = _BASE.N(values);
    var exponent = _EXPONENT.N(values);
    var power = Math.pow (base, exponent);
    return power;
};

Power.D = function(values) {
    //var d = SM.Multiply (_EXPONENT, _BASE.Power (_EXPONENT.Subtract(1)), _BASE.D(values));
    var d = _EXPONENT.Multiply (_BASE.Power (_EXPONENT.Subtract(1))).Multiply(_BASE.D(values));
    return d.Simplify ();
};

Power.Render = function(enclose) {
    var result = new String();
    //if (enclose) result += "(";
    //result += _BASE.Render(true) + " ^ " + _EXPONENT.Render(true);
    result += "<msup>" + _BASE.Render(true) + " " + _EXPONENT.Render(true) + "</msup>";
    //if (enclose) result += ")";
    return result;
};

Power.Simplify = function() {
    var a = _BASE.Simplify ();
    var b = _EXPONENT.Simplify ();
    
    // special cases
    if (b.typename == "Constant") {
        var bn = b.constant;
        if (bn == 0) {
            // 0^0 = special (we define this as 1 for continuity of x^x)
            // *^0 = 1
            return EXPR(Constant)(1);
        } else if (bn == 1) {
            // a^1 = a
            return a;
        }
    }
    if (a.typename == "Constant") {
        var an = a.constant;
        if (an == 0) {
            // 0^* = 0
            return EXPR(Constant)(0);
        } else if (an == 1) {
            // 1^* = 1
            return EXPR(Constant)(1);
        }
        
        // if both are constants, we can collapse them
        if (b.typename == "Constant") {
            var bn = b.constant;
            var pow = Math.pow (an, bn);
            if (Math.abs (pow) < 1000) {
                return EXPR(Constant)(pow);
            }
        }
    }
    
    // otherwise just return a new power object
    return EXPR(Power)(a, b);
};

#undef  _BASE
#undef  _EXPONENT
