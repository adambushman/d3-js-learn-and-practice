const margins = {
    left: 25, right: 25, 
    top: 50, bottom: 25
}

const dims = {
    height: 1200 - margins.top - margins.bottom, 
    width: 1200 - margins.left - margins.right
}


let svg = d3.select("#sankey-plot")
    .append("svg")
    .attr("id", "sankey-viz")
    .attr("viewBox", `0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}`)
    .append("g")
    .attr("transform", `translate(${margins.left},${margins.top})`);

let sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(130)
    .size([dims.width, dims.height]);

d3.json("/Data files/shot-charts.json", function(error, graph) {
    console.log(graph);

    // Constructs a new Sankey generator with the default settings.
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1);
  
    // add in the links
    let link = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
                .attr("class", "link")
                .attr("d", sankey.link() )
                .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                .sort(function(a, b) { return b.dy - a.dy; });
        
    // add in the nodes
    let node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        
    // add the rectangles for the nodes
    node
        .append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            //.style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
            //.style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
        // Add hover text
        .append("title")
            .text(function(d) { return d.name + "\n" + "There is " + d.value + " stuff in this node"; });
    
    // add in the title for the nodes
    node
        .append("text")
            .attr("x", sankey.nodeWidth())
            .attr("y", function(d) { return -30 })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
        .filter(function(d) { return d.x < dims.width / 2; })
            .attr("x", 0)
            .attr("text-anchor", "start");
  });