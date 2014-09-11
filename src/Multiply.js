DERIVE_EXPR(Multiply);

Multiply.SortArray = function(array) {
    // we don't expect these arrays to get big, so bad sorting isn't a big deal
    var sortOrder = { Constant:1, Divide:2, Add:3, Variable:4, Power:5, Function:6, Multiply:7 };
    return array.sort (function (left, right) {
        return sortOrder[left.typename] - sortOrder[right.typename];
    });    
    return array;
};
    
Multiply.N = function(values) {
    var value = this.children[0].N(values);

    // iterate over the children multiplying them together
    var count = this.children.length;
    for (var i = 1; i < count; ++i)
    {
        value *= this.children[i].N(values);
    }
    return value;
};

Multiply.D = function(values) {
    // the derivative of an n-child multiplication node is an addition node
    // with n children (and there must be at least 2):
    // (x * y * z)' = (x' * y * z) + (x * y' * z) + (x * y * z')
    var d = EXPR(Add)();
    var count = this.children.length;
    for (var i = 0; i < count; ++i)
    {
        var m = EXPR(Multiply)();
        for (var j = 0; j < count; ++j)
        {
            var term = (i == j) ? this.children[j].D(values) : this.children[j];
            m.Accumulate (term);
        }
        debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "m = " + m.toString ());
        m = m.Simplify ();
        debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "m (simplified) = " + m.toString ());
        d.Accumulate (m);
    }
    debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "d = " + d.toString ());
    d = d.Simplify ();
    debugOut (DEBUG_LEVEL.DBG, "Multiply.D", "d (simplified) = " + d.toString ());
    return d;
};

Multiply.Render = function(enclose) {
    var result = new String("<mrow>");
    //if (enclose) result += "(";
    result += this.children[0].Render(true);
    var count = this.children.length;
    for (var i = 1; i < count; ++i)
    {
        // invisible multiplication operator
        result += "<mo>&#x2009;</mo>" + this.children[i].Render(true);
        //result += "<mo>&#x2715;</mo>" + this.children[i].Render(true);
    }
    //if (enclose) result += ")";
    return result + "</mrow>";
};

Multiply.Simplify = function() {
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
    
    // if there are any "Multiply" children, suck them up into this one, 
    // simplified children should guarantee that the Multiply nodes have no 
    // Multiply children themselves
    var levelMultiplication = function (children) {
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Multiply") {
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
    levelMultiplication (newChildren);

    // if there are multiple "Constant" children, collapse them into one
    var collapseConstants = function (children) {
        // compute the constant value and eliminate the constant nodes
        var constantValue = 1;
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Constant") {
                children.splice (i, 1);
                constantValue *= child.constant;
            } else {
                ++i;
            }
        }
        
        // evaluate the constant value and decide what to do
        if (constantValue == 1) {
            // skip it because multiplication by 1 is redundant, unless 
            // there are no other nodes left
            if (children.length == 0) {
                children.push (EXPR(Constant)(1));
            }
        } else if (constantValue == 0) {
            // replace the entire construction with a 0
            children.length = 0;
            children.push (EXPR(Constant)(0));
        } else {
            // fold the new constant in
            children.push (EXPR(Constant)(constantValue));
        }
    }
    collapseConstants (newChildren);
    
    // collect like terms into powers
    var collectTerms = function (children) {
        // identify all the terms
        var terms = {};
        for (var i = 0; i < children.length;) {
            var child = children[i];
            if (child.typename == "Variable") {
                terms[child.variable] = (child.variable in terms) ? (terms[child.variable] + 1) : 1;
                children.splice (i, 1);
            } else if (child.typename == "Power") {
                if ((child.children[0].typename == "Variable") AND- (child.children[1].typename == "Constant")) {
                    if (child.children[0].variable in terms) {
                        terms[child.children[0].variable] = terms[child.children[0].variable] + child.children[1].constant;
                    } else {
                        terms[child.children[0].variable] = child.children[1].constant;
                    }
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
            children.push (EXPR(Power)(term, terms[term]).Simplify ());
        }
    }
    collectTerms (newChildren);
    
    // special case of multiplication by a division node calls for a 
    // reordering so that the division node is one up
    var transformDivision = function (children) {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.typename == "Divide") {
                children.splice (i, 1);
                children.push (child.children[0]); // numerator
                var newMultiply = EXPR(Multiply)(children);
                var newDivide = EXPR(Divide)(newMultiply, child.children[1]);
                children.length = 0;
                children.push (newDivide.Simplify ());
                return;
            }
        }
    }
    transformDivision (newChildren);
    
    // if there's only one child, it *is* the result
    if (newChildren.length == 1) {
        return newChildren[0];
    }

    // create a new Multiply object and return it
    return EXPR(Multiply)(newChildren);
};

