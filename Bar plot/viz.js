// Visualization variables

let xScale
let yScale

// Master scale
let s = 500

let margin = {top: s * 0.2, right: s * 0.05, bottom: s * 0.12, left: s * 0.17}
let width = s - margin.left - margin.right
let height = s - margin.top - margin.bottom
let thick = s * 0.05 // Bar thickness adj

let title = "Sales of The Office"
let subtitle = "Distribution of Sales by Month per Employee"
let xlab = "Month"
let ylab = "Sales Dollars"


// Drawing the canvas

let svg = d3.select("#canvas")
    .append("svg")
        .attr("height", height + margin.top + margin.bottom)
        .attr("width", width + margin.left + margin.right)
        .style("background-color", "#fff7e0")
        .style("border", "solid")
        .style("border-color", "#030303")
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")


// Plotting the data

d3.csv('office_sales.csv', (data) => {

    // Grouping sales by month

    let dataF = d3.nest()
        .key((d) => { return d.month })
        .rollup((d) => {
            return d3.sum(d, (g) => { 
                return g.sales
            })
        })
        .entries(data);
    
    dataF.forEach((d) => {
        d.month = d.key;
        d.tsales = d.value;
    })
    
    console.log(dataF)

    // Defining the scales

    xScale = d3.scaleBand()
        .domain(dataF.map((d) => { return d.month }))
        .range([0, width]);

    ymin = d3.min(dataF, (d) => { return d.tsales })
    ymax = d3.max(dataF, (d) => { return d.tsales })

    yScale = d3.scaleLinear()
        .domain([
            ymin - (ymin * 0.15), 
            ymax + (ymin * 0.15)
        ])
        // .domain([44000, 151000])
        .range([height, 0]);

    // Plotting the axes

    svg.append('g')
        .call(d3.axisBottom(xScale))
        .attr('id', 'x-axis')
        .attr('transform', 'translate(0, ' + height + ')');

    svg.append('g')
        .call(d3.axisLeft(yScale))
        .attr('id', 'y-axis')
    
    // Plotting the bars

    svg.selectAll("rect")
        .data(dataF)
        .enter()
        .append("rect")
        .attr("x", (d) => { return xScale(d.month) + thick })
        .attr("y", (d) => { return yScale(d.tsales) }) 
        .attr("height", (d) => { return height - yScale(d.tsales) }) 
        .attr("width", xScale.bandwidth() - (thick * 2))
        .style("margin", "15px")
        .style("fill", "#333333")  

    // Plotting the title, subtitle

    svg.append("text")
        .attr("x", (width / 2) - (margin.left / 2))
        .attr("y", margin.top / -2)
        .attr("text-anchor", "middle")
        .style("font-size", 30)
        .text(title)

    svg.append("text")
        .attr("x", (width / 2) - (margin.left / 2))
        .attr("y", margin.top / -3)
        .attr("text-anchor", "middle")
        .style("font-size", 15)
        .text(subtitle)

    // Plotting the axis labels
    
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", height + (margin.bottom * 2 / 3))
        .attr("text-anchor", "middle")
        .style("font-size", 15)
        .text(xlab)

    svg.append("text")
        .attr("x", (margin.left / -2))
        .attr("y", (height / 2))
        .attr('transform', 'rotate(-90, ' + (margin.left  * 2 / -3) + ', ' + (height / 2) + ')')
        .attr("text-anchor", "middle")
        .style("font-size", 15)
        .text(ylab)  

})