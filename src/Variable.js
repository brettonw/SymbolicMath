DERIVE_EXPR(Variable);

Variable.N = function(values) {
    // search for the variable name in the values array, and if found return
    // it, otherwise check to see if it's a special name, otherwise return 0
    return (this.variable in values) ? values[this.variable] : 
           (this.variable in SM.namedConstants) ? SM.namedConstants[this.variable] :
           0;
};

Variable.D = function(values) {
    // search for the variable name in the values array, and if found return
    // the constant 1, otherwise return 0
    return EXPR(Constant)((this.variable in values) ? 1 : 0);
};

Variable.Render = function(enclose) {
    return "<mi>" + this.variable + "</mi>";
};

Variable._init = function() {
    this.variable = arguments[0];
    return this;
};
