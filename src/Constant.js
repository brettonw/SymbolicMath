DERIVE_EXPR(Constant);

Constant.N = function(values) {
    return this.constant;
};

Constant.D = function(values) {
    return EXPR(Constant)(0);
};

Constant.Render = function (enclose) {
    var re = /^([^e]*)e?([^e]*)$/;
    var matched = re.exec(this.constant.toString());
    // debugger;
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
