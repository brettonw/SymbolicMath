function Plot () 
{
    this.tag = "display";
    this.width = 480;
    this.height = 320;
    this.margin = [48, 8, 18, 23]; // Left, Top, Right, Bottom
    this.title = null;
    this.xAxisTitle = null;
    this.yAxisTitle = null;
    
    this.FromGraphData = function (graphData) 
    {
        DEBUG_OUT(DEBUG_LEVEL.DBG, "FromGraphData", "graphData.length = " + graphData.length);

        // a function to compute the order of magintude of a number, to use
        // for scaling
        var computeOrderOfMagnitude = function (number) {
            number = Math.max (Math.abs (number), 1.0e-6);
            
            // a big number, then a small number
            var order = 0;
            while (number > 10.0) {
                ++order;
                number /= 10.0;
            }
            while (number < 1) {
                --order;
                number *= 10.0;
            }
            return order;
        };
    
        // compute the range of the input array and use that to compute the 
        // delta and a divisor that gives us less than 10 clean ticks
        var buildDomain = function (array, selector, expandDelta, displaySize) {
            // functions to compute the range of the input array
            var arrayFilter = function (array, filterFunc, selector) {
                var result = array[0][selector];
                for (var i = 1, count = array.length; i < count; ++i) {
                    var test = array[i][selector];
                    result = filterFunc (result, test);
                }
                return result;
            }
            var min = arrayFilter (array, Math.min, selector);
            var max = arrayFilter (array, Math.max, selector);
            var delta = max - min;
            if (delta > 0) {
                if (expandDelta) {
                    // expand the range by 1%...
                    var deltaDelta = delta * 0.01;
                    if (max != 0) {
                        max += deltaDelta;
                    }
                    if ((min != 0) AND (min != 1)) {
                        min -= deltaDelta;
                    }
                    delta = max - min;
                }
                
                var tickOrderOfMagnitude = computeOrderOfMagnitude (delta);
                var tryScale = [1.0, 2.0, 2.5, 5.0, 10.0, 20.0, 25.0];
                var tryPrecision = [1, 1, 2, 1, 1, 1, 2];
                var tickDivisorBase = Math.pow (10, tickOrderOfMagnitude - 1);
                var tickDivisorIndex = 0;
                var tickDivisor = tickDivisorBase * tryScale[tickDivisorIndex];
                while ((delta / tickDivisor) > 9) {
                    tickDivisor = tickDivisorBase * tryScale[++tickDivisorIndex];
                }
                
                // now round the top and bottom to that divisor, and build the
                // domain object
                var domain = function () {
                    var domain = Object.create (null);

                    // the basics
                    domain.min = Math.floor (min / tickDivisor) * tickDivisor;
                    domain.max = Math.ceil (max / tickDivisor) * tickDivisor;
                    domain.delta = domain.max - domain.min;
                    domain.orderOfMagnitude = computeOrderOfMagnitude (domain.max);

                    // the numeric display precision
                    domain.precision = tryPrecision[tickDivisorIndex];

                    // the mapping from compute space to display space
                    domain.displaySize = displaySize;
                    domain.map = function (value) {
                        return this.displaySize * (value - this.min) / this.delta;
                    };

                    // the ticks
                    var tickCount = Math.round ((domain.max - domain.min) / tickDivisor);
                    domain.ticks = [];
                    var incr = (domain.max - domain.min) / tickCount;
                    for (var i = 0; i <= tickCount; ++i) {
                        domain.ticks.push (domain.min + (i * incr));
                    }
                    return domain;
                } ();
                return domain;
            }
            return null;
        };
        
        // account for titles in the display
        if (this.title) { this.margin[1] += 18; }
        if (this.xAxisTitle) { this.margin[3] += 15; }
        if (this.yAxisTitle) { this.margin[0] += 15; }

        // compute the domain of the data
        var domain = {
            x: buildDomain (graphData, 'x', false, 1.5),
            y: buildDomain (graphData, 'y', true, 1.0),
            map: function (xy) {
                return {
                    x: this.x.map (xy.x),
                    y: this.y.map (xy.y)
                };
            }
        };

        // create the raw SVG picture for display
        var svg = '<div class="svg-div">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ' +
                    'viewBox="-0.05, -0.05, ' + (domain.x.displaySize + 0.1) + ', ' + (domain.y.displaySize + 0.1) + '" ' +
                    'preserveAspectRatio="xMidYMid meet"' + 
                    '>' +
                    '<g transform="translate(0, 1), scale(1, -1)">'; 

        // format graph labels according to their order of magnitude and 
        // desired precision
        var labelText = function (number, order, precision) {
            var     divisor = Math.pow (10, order);
            var     value = number / divisor;
            if (value != 0) {
                return value.toFixed(precision).toString () + ((order != 0) ? ("e" + order) : "");
            }
            return 0;
        };
        
        // draw the x ticks plus the labels
        var bottom = domain.y.map (domain.y.min);
        var top = domain.y.map (domain.y.max);
        for (var i = 0, count = domain.x.ticks.length; i < count; ++i) {
            var ti = domain.x.ticks[i];
            var tick = domain.x.map (ti);
            svg += '<line x1="' + tick + '" y1="' + bottom + '" x2="' + tick + '" y2="' + top + '" stroke="#c0c0c0" stroke-width="0.005" />'
            svg += '<text  x="' + tick + '" y="' + (bottom + 0.04) + '" font-size="0.025" font-family="Arial" text-anchor="middle" fill="#808080" transform="scale(1,-1)">' + labelText (ti, domain.x.orderOfMagnitude, domain.x.precision) + '</text>';
        }

        // draw the y ticks
        var left = domain.x.map (domain.x.min);
        var right = domain.x.map (domain.x.max);
        for (var i = 0, count = domain.y.ticks.length; i < count; ++i) {
            var tick = domain.y.map (domain.y.ticks[i]);
            svg += '<line x1="' + left + '" y1="' + tick + '" x2="' + right + '" y2="' + tick + '" stroke="#c0c0c0" stroke-width="0.005" />'
        }

        // make the plot
        svg += '<polyline fill="none" stroke="blue" stroke-width="0.0075" points="';
        for (var i = 0, count = graphData.length; i < count; ++i) {
            var datum = domain.map (graphData[i]);
            svg += datum.x + ',' + datum.y + ' ';
        }
        svg += '" />';

        // close the plot
        svg += "</svg></div>"
        
        document.getElementById(this.tag).innerHTML += svg + "<br>";
        /*
        // create the svg and g tags inside the target DOM element
        var g = d3.select("#" + this.tag)
            .append("svg")
            .attr("class", "SymbolicMathPlot")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g");
            
        // format graph labels according to their order of magnitude and 
        // desired precision
        var labelText = function (number, order, precision) {
            var     divisor = Math.pow (10, order);
            var     value = number / divisor;
            if (value != 0) {
                return value.toFixed(precision).toString () + ((order != 0) ? ("e" + order) : "");
            }
            return 0;
        };
        
        // add the labels to the grid lines
        var xAxisOrderOfMagnitude = ComputeOrderOfMagnitude (xDomain[1]);
        g.selectAll(".xLabel")
            .data(xTicks)
            .enter().append("text").attr("class", "xLabel")
            .text(function(d) { return labelText (d, xAxisOrderOfMagnitude, xDomain[3]); })
            .attr("x", function(d) { return x(d); })
            .attr("y", y(yDomain[0]))
            //.attr("dx", 3)
            .attr("dy", 15)        
            .attr("fill", "rgba(0, 0, 0, 0.50)")
            .attr("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-size", "9px");
         
        var yAxisOrderOfMagnitude = ComputeOrderOfMagnitude (yDomain[1]);
        g.selectAll(".yLabel")
            .data(yTicks)
            .enter().append("text").attr("class", "yLabel")
            .text(function(d) { return labelText (d, yAxisOrderOfMagnitude, yDomain[3]); })
            .attr("x", x (xDomain[0]))
            .attr("y", function(d) { return y(d) })
            .attr("dx", -8)
            .attr("dy", 3)        
            .attr("fill", "rgba(0, 0, 0, 0.50)")
            .attr("text-anchor", "end")
            .attr("font-family", "Arial")
            .attr("font-size", "9px");
            
        // add the title across the top
        if (this.title) {
            g.append("text")
                .text(this.title)
                .attr("x", this.width / 2.0)
                .attr("y", 18)
                .attr("fill", "rgba(0, 0, 0, 0.66)")
                .attr("text-anchor", "middle")
                .attr("font-family", "Arial")
                .attr("font-size", "18px");
        }
        
        // label the x and y axes if needed
        if (this.xAxisTitle) {
            g.append("text")
                .text(this.xAxisTitle)
                .attr("x", x((xDomain[0] + xDomain[1]) / 2.0))
                .attr("y", y(yDomain[0]))
                .attr("dy", 30)        
                .attr("fill", "rgba(0, 0, 0, 0.66)")
                .attr("text-anchor", "middle")
                .attr("font-family", "Arial")
                .attr("font-weight", "bold")
                .attr("font-size", "12px");
        }
        
        if (this.yAxisTitle) {
            var ty = y((yDomain[0] + yDomain[1]) / 2);
            g.append ("text")
                .text(this.yAxisTitle)
                .attr("x", 0)
                .attr("y", ty)
                .attr("transform", "translate(10,0) rotate(180,0," + ty + ")")
                .attr("writing-mode", "tb")
                .attr("fill", "rgba(0, 0, 0, 0.66)")
                .attr("text-anchor", "middle")
                .attr("font-family", "Arial")
                .attr("font-weight", "bold")
                .attr("font-size", "12px");
        }
        document.getElementById(this.tag).innerHTML += "<br>";
        */
    }
}
