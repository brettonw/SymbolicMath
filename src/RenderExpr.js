function RenderExpr () 
{
    this.tag = "display";
    this.width = 480;
    this.height = 360;
    this.nodeRadius = 8;

    this.FromExpr = function(dataSource, event)
    {
        var scope = this;
        
        // create the tree object we'll deliver, this object is suitable
        // for use with d3.layout.force, d3.layout.cluster, and 
        // d3.layout.tree. see http://d3js.org for lots of examples
        var treeData = {
            nodes : [],
            links : [],
            nextNodeIndex : -1,
            maxDepth : 0,
            addNode: function (parent, name) {
                var nextNodeIndex = ++(this.nextNodeIndex);
                var node = {
                    "name": name,
                    "depth": parent ? (parent.depth + 1) : 0,
                    "x": Math.random () * scope.width,
                    "y": Math.random () * scope.height,
                    "r": r,
                    "index" : nextNodeIndex,
                    "children": []
                };
                this.nodes.push (node);
                this.maxDepth = Math.max (depth, this.maxDepth);

                if (parent !== null) {
                    parent.children.push (node);
                    this.links.push ( { 
                        source: parent.index, 
                        target: node.index
                    } );
                }
                return node;
            }
        };
        
        // walk the expression tree to build the 

        // create the root node
        var root = treeData.addNode(null, this.dataInterface.getName (), this.rootRadius);

        // the approach here is to walk over the records in order
        // creating nodes as each one of the values change in our current
        // criteria - for efficiency, we're relying on a degree of data
        // coherency from the fact that we sorted the records
        var currentNodes = [];
        for (var i = 0; i < fieldsCount; ++i){
            currentNodes.push(null);
        }
        var traverseRecordToBuild = function(record, parent, i) {
            if (i < fieldsCount) {
                var field = fields[i];
                var recordFieldName = record[field];
                // if we don't currently have a node at this level of the
                // tree, or the traversal name has changed...
                if ((currentNodes[i] === null) || (currentNodes[i].name != recordFieldName)) {
                    currentNodes[i] = treeData.addNode(parent, recordFieldName, i + 1, scope.nodeRadius);
                    for (var j = i + 1; j < fieldsCount; ++j) {
                        currentNodes[j] = null;
                    }
                }
                traverseRecordToBuild(record, currentNodes[i], i + 1)
            }
        };
        var recordCount = records.length;
        for (var recordIndex = 0; recordIndex < recordCount; ++recordIndex) {
            var record = records[recordIndex];
            traverseRecordToBuild (record, root, 0);
        }

        // deliver the tree object we built
        this.updateTreeDisplay(treeData);
    }
},

/**
 * @property {Array} foregroundColor
 * An array of d3.rgb colors used to set the foreground color of nodes,
 * according to the "depth" property of the node within a tree.
 */
foregroundColor     : window.d3 ? [
    d3.rgb ("#d9d9d9"), d3.rgb ("#e6550d"), d3.rgb ("#fd8d3c"), d3.rgb ("#fdae6b"),
    d3.rgb ("#fdd0a2"), d3.rgb ("#8c6d31"),  d3.rgb ("#bd9e39"), d3.rgb ("#e7ba52"),
    d3.rgb ("#e7cb94"), d3.rgb ("#843c39"), d3.rgb ("#ad494a"), d3.rgb ("#d6616b"),
    d3.rgb ("#e7969c"), d3.rgb ("#7b4173"), d3.rgb ("#a55194"), d3.rgb ("#ce6dbd"),
    d3.rgb ("#de9ed6")
] : null,

/**
 * Render a view of tree formatted data using the D3 library - the exact 
 * handling is defined by the subclass implementation.
 * @param {Object} The data to render in D3 tree format.
 */
updateTreeDisplay   : function (treeData) {
    var scope = this;
    //console.log ("updateTreeDisplay");
    
    var browserIE = true;
    if (browserIE) {
        // clean up any existing display
        if (this.svgTarget) this.svgTarget.remove();
        
        // create a new display
        var target = d3.select("#" + this.id);
        if (target[0][0])
        {
            // create the svg element
            var svg = this.svgTarget = target.append("svg").attr("class", "treeDisplay");
                
            // create the base g element to receive a background and a zoom handler
            svg = svg.append("g").attr("class", "treeDisplay");
            svg.append("rect")
                .attr("class", this.backgroundClass)
                .attr("width", "100%")
                .attr("height", "100%");
                
            // fade the display in
            svg.style("opacity", 1.0e-6)
                .transition().duration(1000)
                .style("opacity", 1.0);

            // create a child g element to receive the zoom/pan transformation
            var child = svg.append("g").attr("class", "treeDisplay");
            svg.call (d3.behavior.zoom()
                .translate ([0, 0])
                .scale (1.0)
                .scaleExtent([0.125, 8.0])
                .on("zoom", function() {
                    child
                        //.transition().duration(100)
                        .attr("transform", 
                            "translate(" + d3.event.translate[0] + "," +  d3.event.translate[1] + ") " + 
                            "scale(" +  d3.event.scale + ")"
                        );
                })
            );

            // call the renderer, with a new g element
            this.renderTarget = child.append("g").attr("class", "treeDisplay");
            this.renderTree (treeData);
        }
    } else {
        // clean up any existing display
        if (this.svgTarget) this.svgTarget.remove();
        
        // create a new display
        var target = d3.select("#" + this.id);
        if (target[0][0])
        {
            // create the svg element
            var svg = this.svgTarget = target.append("svg").attr("class", "treeDisplay");
                
            // create the base g element to receive a background and a zoom handler
            svg = svg.append("g").attr("class", "treeDisplay");
            svg.append("rect")
                .attr("class", this.backgroundClass)
                .attr("width", "100%")
                .attr("height", "100%");
                
            // fade the display in
            svg.style("opacity", 1.0e-6)
                .transition().duration(1000)
                .style("opacity", 1.0);

            // create a child g element to receive the zoom/pan transformation
            var child = svg.append("g").attr("class", "treeDisplay");
            svg.call (d3.behavior.zoom()
                .translate ([0, 0])
                .scale (1.0)
                .scaleExtent([0.125, 8.0])
                .on("zoom", function() {
                    child
                        //.transition().duration(100)
                        .attr("transform", 
                            "translate(" + d3.event.translate[0] + "," +  d3.event.translate[1] + ") " + 
                            "scale(" +  d3.event.scale + ")"
                        );
                })
            );

            // call the renderer, with a new g element
            this.renderTarget = child.append("g").attr("class", "treeDisplay");
            this.renderTree (treeData);
        }
    }
},

// Handle the render request in an implementation dependent way.
renderTree          : function (treeData) {},

// virtual method placeholder should be overriden by derived classes
onResizeCallback    : function () {},

onResize            : function() {
    this.callParent(arguments);
    
    if (this.dataReady == true) {
        // prevent any kind of resize event loop in case we change layouts inside
        // the resize callback
        if (this.inResize != true) {
            //console.log (this.alias + ":onResize from " + arguments.callee.caller.$name);
            this.inResize = true;
            this.onResizeDelayedTask.delay (250);
        }
    }
}
});
/**
* A force-directed graph layout.
*/
Ext.define("Ext.ux.view.Graph", {
extend				: "Ext.ux.view.TreeDisplay",
alias				: "widget.uxviewgraph", // xtype of 'uxviewgraph'

nodeRadius			: 6,
nodeRadiusScale		: 2.5,

renderTree			: function (graphData) {
    var scope = this;
    
    // http://mbostock.github.com/d3/ex/force.html
    // build the layout
    this.force = d3.layout.force()
        .gravity (0.05)
        .charge(-100)
        .linkDistance(this.nodeRadius * 4.0)
        .size([this.getWidth (), this.getHeight ()]);
        
    this.force
        .nodes(graphData.nodes)
        .links(graphData.links)
        .start();
        
    // add links with styling information
    var link = this.renderTarget.selectAll("line." + this.linkClass)
        .data(graphData.links);
        
    link.enter()
        .append("line").attr("class", this.linkClass)
        .style("stroke", function(d) { return scope.foregroundColor[d.source.depth]; });
        
    link.exit()
        .remove();

    // add nodes with styling information
    var node = this.renderTarget.selectAll("g.node")
        .data(graphData.nodes);
        
    var nodeEnter = node.enter()
        .append("g").attr("class", "node");
        
    nodeEnter
        .append("circle").attr("class", this.circleClass)
        .attr("r", function(d) { return d.displayRadius; })
        .style("fill", function(d) { return scope.foregroundColor[d.depth]; })
        .style("stroke", function(d) { return scope.foregroundColor[d.depth].darker(2); } );

    // XXX adding text at a fixed offset, d3js.org has an example that
    // XXX uses another force layout to distribute the labels, which we
    // XXX might want to consider for a future implementation detail
    nodeEnter
        .append("text").attr("class", this.textClass)
        .text(function(d) { return d.name; })
        .attr("y", function(d) { return -(d.displayRadius + scope.nodeTextSpacing); })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "bottom");

    nodeEnter
        .call(this.force.drag);
    
    node.exit()
        .remove();
        
    var updateLink = function () {
        this
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }
    
    var updateNode = function () {
        this.attr ("transform" , function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    }

    this.force.on("tick", function () {
        node.call (updateNode);
        link.call (updateLink);
    });
},

onResizeCallback    : function () {
    if (this.force) {
        this.force.size([this.getWidth (), this.getHeight ()]).start();
    }
}
});
