// symbolic computation is implemented using a collection of "Function" nodes
// that are assembled into "Expressions". These "Function" objects implement a
// standard interface:
//
//  - function N(values)   -> returns the numerically evaluated value of the
//                            expression using the variables named in the passed
//                            hash of named values
//  - function D(values)   -> returns a new expression that is the derivative of
//                            this node
//  - function Render()    -> turn the node into a string of MathML elements
//  - function Simplify()  -> returns a simplified node, may be called repeatedly
//                            until the signature doesn't change

// phase 1, basic implementation of expression trees, including numeric
//          evaluation and basic derivation. the near term goal is to be able to
//          process the Blackbody function:
//               L = (h * c * c) / (w^5 * (e^((h * c) / (w * k * T)) - 1))
// phase 2, simplification
// phase 3, an expression parser to build trees from strings
// phase 4, plotting of functions in 1, 2, and 3 dimensions over a specified range
// phase 5, pretty rendering of equations
// phase 6, pretty rendering of expression tree
// phase 7, Solve, Expand, etc.
// phase ?, Multi-dimensional differentiation
//------------------------------------------------------------------------------
var SM = Object.create(null);

SM.Expr = function(a) {
    return Expr.MakeExpr(a);
};

SM.Add = function() {
    return EXPR(Add)(arguments);
};

SM.Subtract = function(a, b) {
    // subtraction is turned into addition with a multiplication by -1
    return this.Add (a, this.Multiply (-1, b));
};

SM.Multiply = function() {
    return EXPR(Multiply)(arguments);
};

SM.Divide = function(a, b) {
    return EXPR(Divide)(a, b);
};

SM.Power = function(a, b) {
    return EXPR(Power)(a, b);
};

SM.Sqrt = function(a) {
    return EXPR(Sqrt)(a);
};

SM.Cosine = function(a) {
    return EXPR(Cos)(a);
};

SM.Sine = function(a) {
    return EXPR(Sin)(a);
};

SM.Tangent = function(a) {
    return this.Divide (this.Sine (a), this.Cosine (a));
};

SM.Exp = function(a) {
    return EXPR(Exp)(a);
};

SM.Log = function(a) {
    return EXPR(Log)(a);
};

SM.Plot = function(graphData) {
    new Plot ().FromGraphData (graphData);
};

SM.namedConstants = {
    MATH_PI             : 3.1415926535897932385,    // Pi
    e                   : 2.718281828459045,        // e
    h                   : 6.62606957e-34,	        // Planck Constant - J s
    k                   : 1.3806488e-23,            // Boltzmann Constant - J K^-1
    c                   : 2.99792458e+08,           // speed of light - m s^-1
    g                   : 9.80665                   // Earth standard gravity - m s^-2
};
