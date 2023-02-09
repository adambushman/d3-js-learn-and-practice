let xScale;
let yScale;
let colorScale;
let yAxisGrid;

let s = 750;

let margin = {top: s * 0.05, right: s * 0.05, bottom: s * 0.12, left: s * 0.12};
let width = s - margin.left - margin.right;
let height = s - margin.top - margin.bottom;
let mouse = s * 0.1;

let xlab = "Allowable Relative to UofU Health";

let keys = ["UofU Health", "Intermountain Health", "Steward Healthcare"]

// Drawing the plot
let svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "white")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Plotting the data

d3.csv("../Data files/health.csv", 
    (raw) => {

        // Transforming the data

        return { 
            insurers: raw.insurers, 
            plans: raw.plans, 
            plan_volume: parseInt(raw.plan_volume), 
            system: raw.system, 
            system_volume: parseInt(raw.system_volume),
            value: parseFloat(raw.value) 
        }
    }, 

    (data) => {

        console.log(data)

        // Defining the scales

        let xmin = d3.min(data, (d) => { return d.value })
        let xmax = d3.max(data, (d) => { return d.value })

        xScale = d3.scaleLinear()
            .domain([
                xmin + (xmin * 0.1), 
                xmax + (xmax * 0.1)
            ])
            .range([0, width]);

        yScale = d3.scaleBand()
            .domain(data.map((d) => { return d.plans }))
            .range([height, 0]);

        colorScale = d3.scaleOrdinal()
            .domain(keys)
            .range(["#ac162c", "#8ab80c", "#214f78"]);
        
        // Plotting and styling the axes
        
        let xAxisGen = d3.axisBottom(xScale);
        let yAxisGen = d3.axisLeft(yScale);

        xAxisGen.ticks(5)

        let xAxis = svg.append("g")
            .call(xAxisGen)
            .attr("transform", "translate(0, " + height + ")");

        let yAxis = svg.append("g")
            .call(yAxisGen);

        xAxis.select(".domain")
            .remove();
        
        xAxis.selectAll("line")
            .remove();
        
        xAxis.selectAll("text")
            .style("font-size", 12);
        
        yAxis.select(".domain")
            .remove();

        yAxis.selectAll("line")
            .remove();

        yAxis.selectAll("text")
            .style("font-size", 15);

        // Plotting and styling the grid

        let xGrid = svg.append("g")
            .attr("class", "x-grid")
            .call(d3.axisBottom(xScale).tickSize(height).tickFormat(''));

        xGrid.select(".domain")
            .remove();
        
        xGrid.selectAll("line")
            .attr("stroke-width", 0.375);
        
        let yGrid = svg.append("g")
            .attr("class", "y-grid")
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''));
            

        
        yGrid.select(".domain")
            .remove();

        yGrid.selectAll("line")
            .attr("stroke-width", 2);


        // Drawing reference line
        
        svg.append("line")
            .attr("x1", xScale(0))
            .attr("x2", xScale(0))
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke-dasharray", ("10, 10"))
            .style("stroke-width", 2)
            .style("stroke", "lightgray")
            .style("fill", "none");

        // Defining the tool tip

        var Tooltip = d3.select("#canvas")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("color", "white")
            .style("background-color", "#414042")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("border-color", "black")
            .style("padding", "5px 10px")
        
            var mouseover = function(d) {
                Tooltip
                    .style("opacity", 1)
                    .transition()
                    .duration(250)
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "#414042")
                    .style("stroke-width", 1)
            };
        
            var mousemove = function(d) {
                Tooltip
                    .html(d.system + "<br>" + Math.ceil(d.value * 100) + "%")
                    .style("left", (d3.mouse(this)[0] + margin.left + margin.right + (mouse * 3)) + "px")
                    .style("top", (d3.mouse(this)[1] + margin.top) + "px")
                    .style("position", "absolute")
            };
        
            var mouseleave = function(d) {
                Tooltip
                    .style("opacity", 0)
                    .transition()
                    .duration(250)
                d3.select(this)
                    .style("opacity", 0.7)
                    .style("stroke-width", 0)
            };

        // Drawing points

        var dia = d3.symbol()
            .type(d3.symbolDiamond)
            .size(150);

        svg
            .selectAll("circle")
            //.selectAll(".point")
            .data(data)
            .enter()
                
                .append("circle")
                .attr("cx", (d) => { return xScale(d.value) })
                .attr("cy", (d) => { return yScale(d.plans) + (yScale.bandwidth() / 2) })
                .attr("r", 10)
                /*
                .append("path")
                .attr("class", "point")
                .attr("d", dia)
                .attr("transform", (d) => {
                    return "translate(" + xScale(d.value) + ", " + (yScale(d.plans) + (yScale.bandwidth() / 2) - 10) + ")"
                })
                */
                .style("fill", (d) => { return colorScale(d.system) })
                .style("opacity", 0.7)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Plotting the annotations

        svg.append("text")
            .attr("x", width / 4)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", 12)
            .text("A note about the left side");
        
        svg.append("text")
            .attr("x", 3 * width / 4)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", 12)
            .text("A note about the right side");

        // Plotting the axis labels

        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", height + (margin.bottom * 2 / 3))
            .attr("text-anchor", "middle")
            .style("font-size", 15)
            .style("font-weight", 600)
            .text(xlab);
})