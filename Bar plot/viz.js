// Visualization variables

let xScale
let yScale

let width = 1000
let height = 1000
let mpadding = 25
let lpadding = 75
let tpadding = 150

let title = "Sales of The Office"
let subtitle = "Distribution of Sales by Month per Employee"
let xlab = "Month"
let ylab = "Sales Dollars"


// Drawing the canvas

let svg = d3.select("#canvas")
    .append("svg")
    .attr("height", height)
    .attr("width", width)
    .style("background-color", "#fff7e0")
    .style("border", "solid")
    .style("border-color", "#030303");

// Plotting the data

d3.csv('office_sales.csv', (data) => {

    // console.log(d3.map(data, (d) => {return d.month}).keys())
    
    // Defining the scales
    xScale = d3.scaleBand()
        .domain(['November', 'December', 'January'])
        .range([mpadding + lpadding, width - mpadding]);

    yScale = d3.scaleLinear()
        .domain([
            d3.max(data, (d) => d.sales * 1.02), 
            d3.min(data, (d) => d.sales)
        ])
        .range([height - tpadding, mpadding + tpadding]);

    // Plotting the axes

    svg.append('g')
        .call(d3.axisBottom(xScale))
        .attr('id', 'x-axis')
        .attr('transform', 'translate(0, ' + (height - (mpadding + lpadding)) + ')');

    svg.append('g')
        .call(d3.axisLeft(yScale))
        .attr('id', 'y-axis')
        .attr('transform', 'translate(' + (mpadding + lpadding) + ', ' + (lpadding - mpadding) + ')');
    
    


    

})