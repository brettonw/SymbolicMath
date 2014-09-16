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
        var ComputeOrderOfMagnitude = function (number) {
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
    
        // a function to make the scales for display "nice" - d3 already
        // has an ability to do this, but it's not quite deterministic enough
        var AdjustDomain = function (domain, adjustDelta) {
            // compute the delta and a divisor that gives us less than 10 clean ticks
            var delta = domain[1] - domain[0];
            if (delta > 0) {
                if (adjustDelta) {
                    // expand the range by 1%...
                    if (domain[1] != 0) {
                        domain[1] = domain[1] + (delta * 0.01);
                    }
                    if ((domain[0] != 0) AND (domain[0] != 1)) {
                        domain[0] = domain[0] - (delta * 0.01);
                    }
                    delta = domain[1] - domain[0];
                }
                
                var tickOrderOfMagnitude = ComputeOrderOfMagnitude (delta);
                var tryScale = [1.0, 2.0, 2.5, 5.0, 10.0, 20.0, 25.0];
                var tryPrecision = [1, 1, 2, 1, 1, 1, 2];
                var tickDivisorBase = Math.pow (10, tickOrderOfMagnitude - 1);
                var tickDivisorIndex = 0;
                var tickDivisor = tickDivisorBase * tryScale[tickDivisorIndex];
                while ((delta / tickDivisor) > 9) {
                    tickDivisor = tickDivisorBase * tryScale[++tickDivisorIndex];
                }
                
                // now round the top and bottom to that divisor
                domain[0] = Math.floor (domain[0] / tickDivisor) * tickDivisor;
                domain[1] = Math.ceil (domain[1] / tickDivisor) * tickDivisor;
                domain[2] = Math.round ((domain[1] - domain[0]) / tickDivisor);
                domain[3] = tryPrecision[tickDivisorIndex];
            }
            return domain;
        };
        
        // account for titles in the display
        if (this.title) { this.margin[1] += 18; }
        if (this.xAxisTitle) { this.margin[3] += 15; }
        if (this.yAxisTitle) { this.margin[0] += 15; }
    
        // compute the domain of the data and map it to the display area
        var arrayFilter = function (array, filterFunc, selector) {
            var result = array[0][selector];
            for (var i = 1, count = array.length; i < count; ++i) {
                var test = array[i][selector];
                result = filterFunc (result, test);
            }
            return result;
        }

        var arrayMin = function (array, selector) { return arrayFilter (array, Math.min, selector); }
        var arrayMax = function (array, selector) { return arrayFilter (array, Math.max, selector); }
        var xMin = arrayMin (graphData, function (d) { return d.x; })
        var xDomain = AdjustDomain ([arrayMin (graphData, 'x'), arrayMax (graphData, 'x')]);
        var yDomain = AdjustDomain ([arrayMin (graphData,'y'), arrayMax (graphData, 'y')], true);
        var xDomainSize = xDomain[1] - xDomain[0];
        var yDomainSize = yDomain[1] - yDomain[0];

        var mapPointX = function (x) {
            return 1.5 * (x - xDomain[0]) / xDomainSize;
        }

        var mapPointY = function (y) {
            return 1.0 * (y - yDomain[0]) / yDomainSize;
        }

        var mapPointXY = function (x, y) {
            return {
                x: mapPointX (x),
                y: mapPointY (y)
            };
        }

        var mapPoint = function (xy) {
            return mapPointXY (xy.x, xy.y);
        }

        // create the raw SVG picture for display
        var svg = '<div class="svg-div">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ' +
                    'viewBox="-0.05, -0.05, 1.6, 1.1" preserveAspectRatio="xMidYMid meet" ' +
                    '>' +
                    '<g transform="translate(0, 1), scale(1, -1)">' + 
            '';

        // function to return an array of values to be used as tick marks
        var makeTicks = function (domain) {
            var ticks = [];
            var incr = (domain[1] - domain[0]) / domain[2];
            for (var i = 0; i <= domain[2]; ++i) {
                ticks.push (domain[0] + (i * incr));
            }
            return ticks;
        };
          
        // draw the x ticks
        var xTicks = makeTicks (xDomain);
        var bottom = mapPointY(yDomain[0]);
        var top = mapPointY(yDomain[1]);
        for (var i = 0, count = xTicks.length; i < count; ++i) {
            var tick = mapPointX (xTicks[i]);
            svg += '<line x1="' + tick + '" y1="' + bottom + '" x2="' + tick + '" y2="' + top + '" stroke="#c0c0c0" stroke-width="0.005" />'
        }

        // draw the y ticks
        var yTicks = makeTicks (yDomain);
        var left = mapPointX(xDomain[0]);
        var right = mapPointX(xDomain[1]);
        for (var i = 0, count = yTicks.length; i < count; ++i) {
            var tick = mapPointY (yTicks[i]);
            svg += '<line x1="' + left + '" y1="' + tick + '" x2="' + right + '" y2="' + tick + '" stroke="#c0c0c0" stroke-width="0.005" />'
        }


        // make the plot
        svg += '<polyline fill="none" stroke="blue" stroke-width="0.0075" points="';
        for (var i = 0, count = graphData.length; i < count; ++i) {
            var datum = mapPoint (graphData[i]);
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
            
        // add a background rectangle
        g.append("rect")
            .attr("fill", "rgba(0, 0, 255, 0.05)")
            .attr("stroke", "rgba(0, 0, 255, 0.1)")
            .attr("width", "100%")
            .attr("height", "100%");
         
        // add a plot line for the data
        g.append("path")
            .attr ("d", d3.svg.line()
                .x(function(d, i) { return x(d.x); })
                .y(function(d) { return y(d.y); }) (graphData))
            .attr("stroke", "rgb(128, 0, 0)")
            .attr("stroke-width", 2.0)
            .attr("fill", "none");
            
        // function to return an array of values to be used as tick marks
        var makeTicks = function (domain) {
            var ticks = [];
            var incr = (domain[1] - domain[0]) / domain[2];
            for (var i = 0; i <= domain[2]; ++i) {
                ticks.push (domain[0] + (i * incr));
            }
            return ticks;
        };
          
        // create the x and y ticks arrays
        var xTicks = makeTicks (xDomain);
        var yTicks = makeTicks (yDomain);
            
        // render the x and y grids behind the plot
        g.selectAll(".xTicks")
            .data(xTicks)
            .enter().append("line").attr("class", "xTicks")
            .attr("x1", function(d) { return x(d); })
            .attr("y1", y(yDomain[0]) + 5)
            .attr("x2", function(d) { return x(d); })
            .attr("y2", y(yDomain[1]))
            .attr("stroke", "rgba(0, 0, 0, 0.20)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "1, 1");

        g.selectAll(".yTicks")
            .data(yTicks)
            .enter().append("line").attr("class", "yTicks")
            .attr("y1", function(d) { return y(d); })
            .attr("x1", x(xDomain[0])-5)
            .attr("y2", function(d) { return y(d); })
            .attr("x2", x(xDomain[1]))
            .attr("stroke", "rgba(0, 0, 0, 0.20)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "1, 1");
            
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
