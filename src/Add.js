DERIVE_EXPR(Add);
Add.SortArray = function(array) {
    // we don't expect these arrays to get big, so bad sorting isn't a big deal
    var sortOrder = { Power:1, Multiply:2, Divide:3, Variable:4, Function:5, Constant:6, Add:7 };
    return array.sort (function (left, right) {
        return sortOrder[left.typename] - sortOrder[right.typename];
    });
    return array;
};

Add.N = function(values) {
    var value = this.children[0].N(values);

    // iterate over the children adding them together
    for (var i = 1; i < this.children.length; ++i) {
        value += this.children[i].N(values);
    }
    return value;
};

Add.D = function(values) {
    // the derivative of an n-child addition node is an addition node
    // with n children (and there must be at least 2:
    // (x + y + z)' = (x' + y' + z')
    var d = EXPR(Add)();
    for (var i = 0; i < this.children.length; ++i) {
        d.Accumulate (this.children[i].D (values));
    }
    return d.Simplify ();
};

Add.Render = function(enclose) {
    var result = new String("<mrow>");
    if (enclose) result += "<mo>(</mo>";
    result += this.children[0].Render(true);
    if ((this.children.length == 2) AND (this.children[1].typename == "Constant") AND (this.children[1].constant < 0)) {
        var constant = EXPR (Constant) (-this.children[1].constant);
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
    // get definitively simplified children
    var simplifyChildren = function (children) {
        var simplifiedChildren = [];
        for (var i = 0; i < children.length; ++i) {
            var simplifiedChild = children[i].Simplify ();
            simplifiedChildren.push (simplifiedChild);
        }
        return simplifiedChildren;
    }
    var newChildren = simplifyChildren (this.children);

    // if there are any "Add" children, suck them up into this one,
    // simplified children should guarantee that the Add nodes have no
    // Add children themselves
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

    // if there are multiple "Constant" children, collapse them into one
    var collapseConstants = function (children) {
        // compute the constant value and eliminate the constant nodes
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

        // add the constant value
        if (constantValue == 0) {
            // skip it because adding 0 is redundant, unless
            // there are no other nodes left
            if (children.length == 0) {
                children.push (EXPR(Constant)(0));
            }
        } else {
            // fold the new constant in
            children.push (EXPR(Constant)(constantValue));
        }
    }
    collapseConstants (newChildren);

    // collect like terms into multiplications
    var collectTerms = function(children) {
        // identify all the terms
        var terms = {};
        var addTerm = function (variable, exponent, value) {
            if (NOT (variable in terms)) { terms[variable] = {}; }
            var term = terms[variable];
            term[exponent] = (exponent in term) ? (term[exponent] + value) : value;
        };
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Variable") {
                //terms[child.variable] = (child.variable in terms) ? (terms[child.variable] + 1) : 1;
                addTerm (child.variable, 1, 1);
                children.splice (i, 1);
            } else if (child.typename == "Multiply") {
                if ((child.children[0].typename == "Constant") AND (child.children[1].typename == "Variable")) {
                    addTerm (child.children[1].variable, 1, child.children[0].constant);
                    children.splice (i, 1);
                } else if ((child.children[0].typename == "Constant") AND (child.children[1].typename == "Power")) {
                    var power = child.children[1];
                    if ((power.children[0].typename == "Variable") AND (power.children[1].typename == "Constant")) {
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
                if ((child.children[0].typename == "Variable") AND (child.children[1].typename == "Constant")) {
                    addTerm (child.children[0].variable, child.children[1].constant, 1);
                    children.splice (i, 1);
                } else {
                    ++i;
                }
            } else {
                ++i;
            }
        }

        // now process the gathered terms
        for (var term in terms) {
            var termsExp = terms[term];
            for (var exponent in termsExp) {
                var value = termsExp[exponent];
                var newTerm = EXPR(Multiply)(value, EXPR(Power)(term, exponent)).Simplify ();
                children.push (newTerm);
            }
        }
    }
    //collectTerms (newChildren);

    // if there's only one child, it *is* the result
    if (newChildren.length == 1) {
        return newChildren[0];
    }

    // create a new Add object and return it
    return EXPR(Add)(newChildren);
}
