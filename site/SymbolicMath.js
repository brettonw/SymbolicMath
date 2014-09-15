"use strict";var DEBUG_LEVEL={TRC:0,DBG:1,INF:2,ERR:3,SLN:4};var globalDebugLevel=DEBUG_LEVEL.DBG;function debugOut(d,c){var b=d+": "+c;var a=document.getElementById("debugOut");if(a!=null){a.innerHTML+=d+": "+c+"<br />\n"}console.log(b)}var Utility=Object.create(null);Utility.shallowCopy=function(c,b){for(var a in c){if(c.hasOwnProperty(a)){b[a]=c[a]}}};Utility.combine=function(d,c){var e=Object.create(null);Utility.shallowCopy(d,e);Utility.shallowCopy(c,e);return e};Utility.add=function(b,d,c){var e=Object.create(null);Utility.shallowCopy(b,e);e[d]=c;return e};Utility.make=function(b,a){var c=Object.create(null);c[b]=a;return c};var Expr=Object.create(null);Expr.MakeExpr=function(b){var c=typeof(b);if((c=="object")&&("MakeExpr" in b)){return b}else{if(c=="string"){if(Number(b).toString()==b){return Object.create(Constant)._init(Number(b))}else{return Object.create(Variable)._init(b)}}else{if(c=="number"){return Object.create(Constant)._init(b)}}}return null};Expr.Accumulate=function(b){var e=Object.prototype.toString.call(b);if((e=="[object Array]")||(e=="[object Arguments]")){for(var c=0;c<b.length;c++){this.children.push(this.MakeExpr(b[c]))}}else{this.children.push(this.MakeExpr(b))}var d=Object.prototype.toString.call(this.SortArray);if(d=="[object Function]"){this.SortArray(this.children)}return this};Expr.Add=function(b){return Object.create(Add)._init(this,b)};Expr.Subtract=function(b){return Object.create(Add)._init(this,Object.create(Multiply)._init(-1,b))};Expr.Multiply=function(b){return Object.create(Multiply)._init(this,b)};Expr.Divide=function(b){return Object.create(Divide)._init(this,b)};Expr.Power=function(b){return Object.create(Power)._init(this,b)};Expr.toString=function(){return'<math xmlns="http://www.w3.org/1998/Math/MathML">'+this.Render(false)+"</math>"};Expr.Simplify=function(){return this};Expr._init=function(){this.children=[];var b=arguments;if(b.length==1){var a=Object.prototype.toString.call(b[0]);if((a=="[object Arguments]")||(a=="[object Array]")){b=b[0]}}this.Accumulate(b);return this};var Constant=Object.create(Expr,{typename:{value:"Constant",writable:false,configurable:false,enumerable:true}});Constant.N=function(a){return this.constant};Constant.D=function(a){return Object.create(Constant)._init(0)};Constant.Render=function(c){var d=/^([^e]*)e?([^e]*)$/;var b=d.exec(this.constant.toString());var a="<mn>"+b[1]+"</mn>";if(b[2].length>0){a+="<mo>&times;</mo><msup><mn>10</mn><mn>"+b[2]+"</mn></msup>"}return a};Constant._init=function(){this.constant=arguments[0];return this};var Variable=Object.create(Expr,{typename:{value:"Variable",writable:false,configurable:false,enumerable:true}});Variable.N=function(a){return(this.variable in a)?a[this.variable]:(this.variable in SM.namedConstants)?SM.namedConstants[this.variable]:0};Variable.D=function(a){return Object.create(Constant)._init((this.variable in a)?1:0)};Variable.Render=function(a){return"<mi>"+this.variable+"</mi>"};Variable._init=function(){this.variable=arguments[0];return this};var Add=Object.create(Expr,{typename:{value:"Add",writable:false,configurable:false,enumerable:true}});Add.SortArray=function(b){var a={Power:1,Multiply:2,Divide:3,Variable:4,Function:5,Constant:6,Add:7};return b.sort(function(d,c){return a[d.typename]-a[c.typename]});return b};Add.N=function(a){var c=this.children[0].N(a);for(var b=1;b<this.children.length;++b){c+=this.children[b].N(a)}return c};Add.D=function(a){var c=Object.create(Add)._init();for(var b=0;b<this.children.length;++b){c.Accumulate(this.children[b].D(a))}return c.Simplify()};Add.Render=function(b){var a=new String("<mrow>");if(b){a+="<mo>(</mo>"}a+=this.children[0].Render(true);if((this.children.length==2)&&(this.children[1].typename=="Constant")&&(this.children[1].constant<0)){var d=Object.create(Constant)._init(-this.children[1].constant);a+="<mo>&#x2212;</mo>"+d.Render(true)}else{for(var c=1;c<this.children.length;++c){a+="<mo>&#x002b;</mo>"+this.children[c].Render(true)}}if(b){a+="<mo>)</mo>"}return a+"</mrow>"};Add.Simplify=function(){var d=function(g){var j=[];for(var f=0;f<g.length;++f){var h=g[f].Simplify();j.push(h)}return j};var e=d(this.children);var a=function(k){for(var h=0;h<k.length;){var l=k[h];if(l.typename=="Add"){k.splice(h,1);for(var g=0;g<l.children.length;++g){var f=l.children[g];k.push(f)}}else{++h}}};a(e);var b=function(g){var h=0;for(var f=0;f<g.length;){var j=g[f];if(j.typename=="Constant"){g.splice(f,1);h+=j.constant}else{++f}}if(h==0){if(g.length==0){g.push(Object.create(Constant)._init(0))}}else{g.push(Object.create(Constant)._init(h))}};b(e);var c=function(h){var l={};var j=function(i,t,s){if(!(i in l)){l[i]={}}var r=l[i];r[t]=(t in r)?(r[t]+s):s};for(var m=0;m<h.length;){var g=h[m];if(g.typename=="Variable"){j(g.variable,1,1);h.splice(m,1)}else{if(g.typename=="Multiply"){if((g.children[0].typename=="Constant")&&(g.children[1].typename=="Variable")){j(g.children[1].variable,1,g.children[0].constant);h.splice(m,1)}else{if((g.children[0].typename=="Constant")&&(g.children[1].typename=="Power")){var f=g.children[1];if((f.children[0].typename=="Variable")&&(f.children[1].typename=="Constant")){j(f.children[0].variable,f.children[1].constant,g.children[0].constant);h.splice(m,1)}else{++m}}else{if(DEBUG_LEVEL.DBG>=globalDebugLevel){debugOut("Add.Simplify.collectTerms","Skipping term")}++m}}}else{if(g.typename=="Power"){if((g.children[0].typename=="Variable")&&(g.children[1].typename=="Constant")){j(g.children[0].variable,g.children[1].constant,1);h.splice(m,1)}else{++m}}else{++m}}}}for(var k in l){var q=l[k];for(var n in q){var o=q[n];var p=Object.create(Multiply)._init(o,Object.create(Power)._init(k,n)).Simplify();h.push(p)}}};if(e.length==1){return e[0]}return Object.create(Add)._init(e)};var Multiply=Object.create(Expr,{typename:{value:"Multiply",writable:false,configurable:false,enumerable:true}});Multiply.SortArray=function(b){var a={Constant:1,Divide:2,Add:3,Variable:4,Power:5,Function:6,Multiply:7};return b.sort(function(d,c){return a[d.typename]-a[c.typename]});return b};Multiply.N=function(a){var d=this.children[0].N(a);var c=this.children.length;for(var b=1;b<c;++b){d*=this.children[b].N(a)}return d};Multiply.D=function(b){var h=Object.create(Add)._init();var g=this.children.length;for(var f=0;f<g;++f){var a=Object.create(Multiply)._init();for(var c=0;c<g;++c){var e=(f==c)?this.children[c].D(b):this.children[c];a.Accumulate(e)}if(DEBUG_LEVEL.DBG>=globalDebugLevel){debugOut("Multiply.D","m = "+a.toString())}a=a.Simplify();if(DEBUG_LEVEL.DBG>=globalDebugLevel){debugOut("Multiply.D","m (simplified) = "+a.toString())}h.Accumulate(a)}if(DEBUG_LEVEL.DBG>=globalDebugLevel){debugOut("Multiply.D","d = "+h.toString())}h=h.Simplify();if(DEBUG_LEVEL.DBG>=globalDebugLevel){debugOut("Multiply.D","d (simplified) = "+h.toString())}return h};Multiply.Render=function(b){var a=new String("<mrow>");a+=this.children[0].Render(true);var d=this.children.length;for(var c=1;c<d;++c){a+="<mo>&#x2009;</mo>"+this.children[c].Render(true)}return a+"</mrow>"};Multiply.Simplify=function(){var e=function(h){var k=[];for(var g=0;g<h.length;++g){var j=h[g].Simplify();k.push(j)}return k};var f=e(this.children);var d=function(l){for(var k=0;k<l.length;){var m=l[k];if(m.typename=="Multiply"){l.splice(k,1);for(var h=0;h<m.children.length;++h){var g=m.children[h];l.push(g)}}else{++k}}};d(f);var a=function(h){var j=1;for(var g=0;g<h.length;){var k=h[g];if(k.typename=="Constant"){h.splice(g,1);j*=k.constant}else{++g}}if(j==1){if(h.length==0){h.push(Object.create(Constant)._init(1))}}else{if(j==0){h.length=0;h.push(Object.create(Constant)._init(0))}else{h.push(Object.create(Constant)._init(j))}}};a(f);var c=function(j){var k={};for(var h=0;h<j.length;){var l=j[h];if(l.typename=="Variable"){k[l.variable]=(l.variable in k)?(k[l.variable]+1):1;j.splice(h,1)}else{if(l.typename=="Power"){if((l.children[0].typename=="Variable")&&-(l.children[1].typename=="Constant")){if(l.children[0].variable in k){k[l.children[0].variable]=k[l.children[0].variable]+l.children[1].constant}else{k[l.children[0].variable]=l.children[1].constant}j.splice(h,1)}else{++h}}else{++h}}}for(var g in k){j.push(Object.create(Power)._init(g,k[g]).Simplify())}};c(f);var b=function(j){for(var h=0;h<j.length;++h){var l=j[h];if(l.typename=="Divide"){j.splice(h,1);j.push(l.children[0]);var k=Object.create(Multiply)._init(j);var g=Object.create(Divide)._init(k,l.children[1]);j.length=0;j.push(g.Simplify());return}}};b(f);if(f.length==1){return f[0]}return Object.create(Multiply)._init(f)};var Power=Object.create(Expr,{typename:{value:"Power",writable:false,configurable:false,enumerable:true}});Power.N=function(a){var d=this.children[0].N(a);var c=this.children[1].N(a);var b=Math.pow(d,c);return b};Power.D=function(a){var b=this.children[1].Multiply(this.children[0].Power(this.children[1].Subtract(1))).Multiply(this.children[0].D(a));return b.Simplify()};Power.Render=function(b){var a=new String();a+="<msup>"+this.children[0].Render(true)+" "+this.children[1].Render(true)+"</msup>";return a};Power.Simplify=function(){var d=this.children[0].Simplify();var c=this.children[1].Simplify();if(c.typename=="Constant"){var g=c.constant;if(g==0){return Object.create(Constant)._init(1)}else{if(g==1){return d}}}if(d.typename=="Constant"){var f=d.constant;if(f==0){return Object.create(Constant)._init(0)}else{if(f==1){return Object.create(Constant)._init(1)}}if(c.typename=="Constant"){var g=c.constant;var e=Math.pow(f,g);if(Math.abs(e)<1000){return Object.create(Constant)._init(e)}}}return Object.create(Power)._init(d,c)};var Sqrt=Object.create(Expr,{typename:{value:"Power",writable:false,configurable:false,enumerable:true}});Sqrt.N=function(a){var c=this.children[0].N(a);var b=Math.sqrt(c);return b};Sqrt.D=function(a){var b=Object.create(Divide)._init(1,Object.create(Multiply)._init(2,this)).Multiply(this.children[0].D(a));return b.Simplify()};Sqrt.Render=function(a){return"<msqrt>"+this.children[0].Render(false)+"</msqrt>"};Sqrt.Simplify=function(){var b=this.children[0].Simplify();if(b.typename=="Constant"){var c=Math.sqrt(base);return Object.create(Constant)._init(c)}return Object.create(Sqrt)._init(b)};var Divide=Object.create(Expr,{typename:{value:"Divide",writable:false,configurable:false,enumerable:true}});Divide.N=function(a){return this.children[0].N(a)/this.children[1].N(a)};Divide.D=function(a){var b=this.children[0].D(a).Multiply(this.children[1]).Subtract(this.children[0].Multiply(this.children[1].D(a))).Divide(this.children[1].Power(2));return b.Simplify()};Divide.Render=function(b){var a=new String();a+="<mfrac>"+this.children[0].Render(true)+" "+this.children[1].Render(true)+"</mfrac>";return a};Divide.Simplify=function(){var d=this.children[0].Simplify();var c=this.children[1].Simplify();if((d.typename=="Constant")&&(c.typename=="Constant")){var f=d.N(null)/c.N(null);return Object.create(Constant)._init(f)}if((d.typename=="Multiply")&&(c.typename=="Constant")){var e=d.children;if(e[0].typename=="Constant"){e[0]=Object.create(Divide)._init(e[0],c);return d.Simplify()}}return Object.create(Divide)._init(d,c)};var Cos=Object.create(Expr,{typename:{value:"Function",writable:false,configurable:false,enumerable:true}});Cos.N=function(a){return Math.cos(this.children[0].N(a))};Cos.D=function(a){var b=this.children[0].D(a).Multiply(Object.create(Sin)._init(this.children[0])).Multiply(-1);return b.Simplify()};Cos.Render=function(a){return"<mi>cos</mi><mrow><mo>(</mo>"+this.children[0].Render(false)+"<mo>)</mo></mrow>"};var Sin=Object.create(Expr,{typename:{value:"Function",writable:false,configurable:false,enumerable:true}});Sin.N=function(a){return Math.sin(this.children[0].N(a))};Sin.D=function(a){var b=this.children[0].D(a).Multiply(Object.create(Cos)._init(this.children[0]));return b.Simplify()};Sin.Render=function(a){return"<mi>sin</mi><mrow><mo>(</mo>"+this.children[0].Render(false)+"<mo>)</mo></mrow>"};var Exp=Object.create(Expr,{typename:{value:"Function",writable:false,configurable:false,enumerable:true}});Exp.N=function(a){return Math.exp(this.children[0].N(a))};Exp.D=function(a){var b=this.children[0].D(a).Multiply(this);return b.Simplify()};Exp.Render=function(a){return"<msup><mi>e</mi>"+this.children[0].Render(false)+"</msup>"};var Log=Object.create(Expr,{typename:{value:"Function",writable:false,configurable:false,enumerable:true}});Log.N=function(a){return Math.log()(this.children[0].N(a))};Log.D=function(a){var b=Object.create(Divide)._init(1,this.children[0]).Multiply(this.children[0].D(a));return b.Simplify()};Log.Render=function(a){return"Log ("+this.children[0].Render(false)+")"};function Plot(){this.tag="display";this.width=480;this.height=360;this.margin=[48,8,18,23];this.title=null;this.xAxisTitle=null;this.yAxisTitle=null;this.FromGraphData=function(p){if(DEBUG_LEVEL.DBG>=globalDebugLevel){debugOut("FromGraphData","graphData.length = "+p.length)}var i=function(q){q=Math.max(Math.abs(q),0.000001);var g=0;while(q>10){++g;q/=10}while(q<1){--g;q*=10}return g};var j=function(v,r){var x=v[1]-v[0];if(x>0){if(r){if(v[1]!=0){v[1]=v[1]+(x*0.01)}if((v[0]!=0)&&(v[0]!=1)){v[0]=v[0]-(x*0.01)}x=v[1]-v[0]}var s=i(x);var q=[1,2,2.5,5,10,20,25];var g=[1,1,2,1,1,1,2];var u=Math.pow(10,s-1);var w=0;var t=u*q[w];while((x/t)>9){t=u*q[++w]}v[0]=Math.floor(v[0]/t)*t;v[1]=Math.ceil(v[1]/t)*t;v[2]=Math.round((v[1]-v[0])/t);v[3]=g[w]}return v};if(this.title){this.margin[1]+=18}if(this.xAxisTitle){this.margin[3]+=15}if(this.yAxisTitle){this.margin[0]+=15}var l=j([d3.min(p,function(g){return g.x}),d3.max(p,function(g){return g.x})]);var a=j([d3.min(p,function(g){return g.y}),d3.max(p,function(g){return g.y})],true);var o=d3.scale.linear().domain([l[0],l[1]]).range([0+this.margin[0],this.width-this.margin[2]]);var n=d3.scale.linear().domain([a[0],a[1]]).range([this.height-this.margin[3],0+this.margin[1]]);var k=d3.select("#"+this.tag).append("svg").attr("class","SymbolicMathPlot").attr("width",this.width).attr("height",this.height).append("g");k.append("rect").attr("fill","rgba(0, 0, 255, 0.05)").attr("stroke","rgba(0, 0, 255, 0.1)").attr("width","100%").attr("height","100%");k.append("path").attr("d",d3.svg.line().x(function(q,g){return o(q.x)}).y(function(g){return n(g.y)})(p)).attr("stroke","rgb(128, 0, 0)").attr("stroke-width",2).attr("fill","none");var e=function(r){var q=[];var s=(r[1]-r[0])/r[2];for(var g=0;g<=r[2];++g){q.push(r[0]+(g*s))}return q};var h=e(l);var m=e(a);k.selectAll(".xTicks").data(h).enter().append("line").attr("class","xTicks").attr("x1",function(g){return o(g)}).attr("y1",n(a[0])+5).attr("x2",function(g){return o(g)}).attr("y2",n(a[1])).attr("stroke","rgba(0, 0, 0, 0.20)").attr("stroke-width",1).attr("stroke-dasharray","1, 1");k.selectAll(".yTicks").data(m).enter().append("line").attr("class","yTicks").attr("y1",function(g){return n(g)}).attr("x1",o(l[0])-5).attr("y2",function(g){return n(g)}).attr("x2",o(l[1])).attr("stroke","rgba(0, 0, 0, 0.20)").attr("stroke-width",1).attr("stroke-dasharray","1, 1");var d=function(r,g,q){var t=Math.pow(10,g);var s=r/t;if(s!=0){return s.toFixed(q).toString()+((g!=0)?("e"+g):"")}return 0};var c=i(l[1]);k.selectAll(".xLabel").data(h).enter().append("text").attr("class","xLabel").text(function(g){return d(g,c,l[3])}).attr("x",function(g){return o(g)}).attr("y",n(a[0])).attr("dy",15).attr("fill","rgba(0, 0, 0, 0.50)").attr("text-anchor","middle").attr("font-family","Arial").attr("font-size","9px");var b=i(a[1]);k.selectAll(".yLabel").data(m).enter().append("text").attr("class","yLabel").text(function(g){return d(g,b,a[3])}).attr("x",o(l[0])).attr("y",function(g){return n(g)}).attr("dx",-8).attr("dy",3).attr("fill","rgba(0, 0, 0, 0.50)").attr("text-anchor","end").attr("font-family","Arial").attr("font-size","9px");if(this.title){k.append("text").text(this.title).attr("x",this.width/2).attr("y",18).attr("fill","rgba(0, 0, 0, 0.66)").attr("text-anchor","middle").attr("font-family","Arial").attr("font-size","18px")}if(this.xAxisTitle){k.append("text").text(this.xAxisTitle).attr("x",o((l[0]+l[1])/2)).attr("y",n(a[0])).attr("dy",30).attr("fill","rgba(0, 0, 0, 0.66)").attr("text-anchor","middle").attr("font-family","Arial").attr("font-weight","bold").attr("font-size","12px")}if(this.yAxisTitle){var f=n((a[0]+a[1])/2);k.append("text").text(this.yAxisTitle).attr("x",0).attr("y",f).attr("transform","translate(10,0) rotate(180,0,"+f+")").attr("writing-mode","tb").attr("fill","rgba(0, 0, 0, 0.66)").attr("text-anchor","middle").attr("font-family","Arial").attr("font-weight","bold").attr("font-size","12px")}document.getElementById(this.tag).innerHTML+="<br>"}}function Sampler(){this.minRecursion=2;this.maxRecursion=12;this.errorToleranceDistance=0.001;this.errorToleranceSlope=0.001;this.Evaluate=function(h,g,b){var e=this;var f=h.D(Utility.make(g.x,g.from));var a=function(i){var k=Utility.add(b,g.x,i);var l=h.N(k);var j=f.N(k);return{x:i,y:l,dy:j}};var c=function(k,j,m){if(m<e.maxRecursion){var o=function(s,v,u){var r=(s.dy+v.dy)/2;var t=Math.abs((u.dy/r)-1);if(DEBUG_LEVEL.TRC>=globalDebugLevel){debugOut("Sampler.Evaluate.sampleErrorSlope",((t>e.errorToleranceSlope)?"FAIL":"pass")+", error = "+t)}return t};var l=function(s,x,v){var t=-(x.y-s.y);var r=(x.x-s.x);var w=-((t*s.x)+(r*s.y));var u=Math.abs((t*v.x)+(r*v.y)+w);if(DEBUG_LEVEL.TRC>=globalDebugLevel){debugOut("Sampler.Evaluate.sampleErrorDistance",((u>e.errorToleranceDistance)?"FAIL":"pass")+", d = "+u)}return u};var i=a((k.x+j.x)/2);if((m<e.minRecursion)||(o(k,j,i)>e.errorToleranceSlope)||(l(k,j,i)>e.errorToleranceDistance)){var n=c(k,i,m+1);var p=c(i,j,m+1);var q=n.concat(p);return q}}return[j]};var d=[a(g.from)];d=d.concat(c(d[0],a(g.to),0));return d};this.NSolve=function(d,c,a){var b=d.D(Utility.make(c.x,c.from))}}function Integrator(){this.defaultStepCount=25;this.Evaluate=function(f,c,a,g){var i=a.hasOwnProperty("dx")?a.dx:((a.to-a.from)/this.defaultStepCount);var h=function(m){var l=Utility.add(g,a.x,m.x);var k=c.N(l)*i;var n=m.y+k;var j=m.x+i;return{x:j,y:n}};var b=function(m){var l=Utility.add(g,a.x,m.x+(0.5*i));var k=c.N(l)*i;var n=m.y+k;var j=m.x+i;return{x:j,y:n}};var e=function(l){var m={x:a.from,y:f};var j=a.to-(i*0.5);var k=[];k.push(m);while(m.x<j){m=l(m);k.push(m)}return k};var d=e(b);return d};this.EvaluateFromExpr=function(e,d,a){var c=e.D(Utility.make(d.x,d.from));var b=e.N(Utility.add(a,d.x,d.from));return this.Evaluate(b,c,d,a)}}var SM=Object.create(null);SM.Expr=function(b){return Expr.MakeExpr(b)};SM.Add=function(){return Object.create(Add)._init(arguments)};SM.Subtract=function(d,c){return this.Add(d,this.Multiply(-1,c))};SM.Multiply=function(){return Object.create(Multiply)._init(arguments)};SM.Divide=function(d,c){return Object.create(Divide)._init(d,c)};SM.Power=function(d,c){return Object.create(Power)._init(d,c)};SM.Sqrt=function(b){return Object.create(Sqrt)._init(b)};SM.Cosine=function(b){return Object.create(Cos)._init(b)};SM.Sine=function(b){return Object.create(Sin)._init(b)};SM.Tangent=function(b){return this.Divide(this.Sine(b),this.Cosine(b))};SM.Exp=function(b){return Object.create(Exp)._init(b)};SM.Log=function(b){return Object.create(Log)._init(b)};SM.Plot=function(a){new Plot().FromGraphData(a)};SM.namedConstants={"&pi;":Math.PI,e:Math.E,h:6.62606957e-34,k:1.3806488e-23,c:299792458,g:9.80665};