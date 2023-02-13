let xScale;
let yScale;
let colorScale;
let yAxisGrid;

let s = 750;

let margin = {top: s * 0.05, right: s * 0.05, bottom: s * 0.12, left: s * 0.17};
let width = s - margin.left - margin.right;
let height = s - margin.top - margin.bottom;
let mouse = s * 0.1;

let xlab = "Allowable Relative to UofU Health";

let keys = ["UofU Health", "Intermountain Health", "Steward Healthcare"];

// Volume formatter

const p = d3.precisionPrefix(1e3, 1e3);
const f = d3.formatPrefix("." + p, 1e3);

// console.log(f(181000));

// Label Groupers

function getGroupers(d) {
    let group = "";
    let obj = [];

    for (let i = 0; i < d.length; i++) {
        if (group != d[i].insurers) {
            group = d[i].insurers;
            obj.push({ i: d[i].insurers, p: d[i].plans});
        }
    }

    return obj;
};

// Drawing the plot

let svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "white")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let pos = [document.getElementById("canvas").offsetLeft, document.getElementById("canvas").offsetTop]

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

        console.log(data);
        console.log(getGroupers(data));

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
            .range([0, height]);

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

        let yAxisMain = svg.append("g")
            .call(yAxisGen);

        let yAxisGroup

        xAxis.select(".domain")
            .remove();
        
        xAxis.selectAll("line")
            .remove();
        
        xAxis.selectAll("text")
            .style("font-size", 12);
        
        yAxisMain.select(".domain")
            .remove();

        yAxisMain.selectAll("line")
            .remove();

        yAxisMain.selectAll("text")
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
                    .transition()
                    .duration(250)
                    .style("opacity", 1)

                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "#414042")
                    .style("stroke-width", 1)
            };

            var mousemove = function(d) {

                let my_pos = d3.select(this).attr("transform");
                let my_x = parseFloat(my_pos.substring(10, my_pos.indexOf(",")));
                let my_y = parseFloat(my_pos.substring(my_pos.indexOf(",")+1, my_pos.length-1));

                Tooltip
                    .html("<h4 class='tt'>" + d.system + "</h4>" + "<p>Value: " + Math.ceil(d.value * 100) + "%<br>Volume: " + f(d.system_volume) + "</p>")
                    .style("left", (my_x + pos[0] + mouse) + "px")
                    .style("top", (my_y + pos[1] - mouse) + "px")
                    .style("position", "absolute")
            };
        
            var mouseleave = function(d) {
                Tooltip
                    .transition()
                    .duration(250)
                    .style("opacity", 0)

                d3.select(this)
                    .style("opacity", 0.7)
                    .style("stroke-width", 0)
            };

        // Custom Shape

        var customSymbolSquare = { 
            draw: function(context, size){
                let h = Math.sqrt(size)*0.75/2;
                let w = Math.sqrt(size)/2;
                context.moveTo(0,0);
                context.lineTo(-w,-h*1.5);
                context.lineTo(-w,-h*3.5);
                context.lineTo(w,-h*3.5);
                context.lineTo(w,-h*1.5);
                context.closePath();
            }
        }

        var shpe = d3.symbol().type(customSymbolSquare).size(200);

        svg.selectAll(".point")
            .data(data)
            .enter()
                .append("path")
                .attr("class", "point")
                .attr("d", shpe)
                .attr("transform", (d) => {
                    return "translate(" + xScale(d.value) + ", " + (yScale(d.plans) + (yScale.bandwidth() / 2)) + ")"
                })
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

        svg.selectAll("mylab")
            .data(getGroupers(data))
            .enter()
            .append("text")
            .attr("class", "group-text")
            .attr("x", (-1 * margin.left) + 15)
            .attr("y", (d) => { return yScale(d.p) + 15 })
            .text((d) => { return d.i })
            .style("font-weight", 600)
            .style("text-decoration", "underline")
            .style("color", "#414042");

        svg.selectAll("myvol")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "vol-text")
            .attr("x", -15)
            .attr("y", (d) => { return yScale(d.plans) + yScale.bandwidth() - 12 })
            .text((d) => { return f(d.plan_volume) })
            .style("font-size", 12)
            .style("text-anchor", "end")
            .style("font-style", "italic")
            .style("color", "#414042");

})