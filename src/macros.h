"use strict";

#define DERIVE_EXPR(className)                                                  \
var className = Object.create(Expr, {                                           \
    typename : {                                                                \
        value :         #className,                                             \
        writable :      false,                                                  \
        configurable :  false,                                                  \
        enumerable :    true                                                    \
    }})                                                                         \
    
#define DERIVE_EXPR_ALIAS(className, typeName)                                  \
var className = Object.create(Expr, {                                           \
    typename : {                                                                \
        value :         #typeName,                                              \
        writable :      false,                                                  \
        configurable :  false,                                                  \
        enumerable :    true                                                    \
    }})                                                                         \
    
#define EXPR(typeName)                                                          \
    Object.create(typeName)._init                                               \
    
#define AND     &&
#define OR      ||
#define NOT     !

#define MATH_PI "&pi;"
