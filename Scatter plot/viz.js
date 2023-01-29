let values = []

let xScale
let yScale

let width = 700
let height = 500
let mpadding = 20
let lpadding = 50
let tpadding = 100

let title = 'NBA Scoring Leaders'
let subtitle = 'Points vs True Shooting Attempts'
let xlab = 'Points per Game'
let ylab = 'True Shooting Attempts (TSA) per Game'


// Drawing the Canvas
let svg = d3.select('#canvas')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background-color', 'lavender')

// Plotting the data
d3.csv('data.csv', (data) => { 

    // Defining scales
    xScale = d3
        .scaleLinear()
        .domain([
            d3.min(data, (item) => { return item['PTS'] * 0.98}), 
            d3.max(data, (item) => { return item['PTS'] * 1.02})
        ])
        .range([lpadding + mpadding, width - mpadding])
    
    yScale = d3
        .scaleLinear()
        .domain([
            d3.min(data, (item) => { return item['TSA'] * 0.98}), 
            d3.max(data, (item) => { return item['TSA'] * 1.02})
        ])
        .range([height - tpadding, lpadding + mpadding])

    sizeScale = d3
        .scaleLinear()
        .domain([
            d3.min(data, (item) => { return item['MIN']}), 
            d3.max(data, (item) => { return item['MIN']})
        ])
        .range([4, 12])

    // Plotting the axes & labels
    svg.append('g')
        .call(d3.axisBottom(xScale))
        .attr('id', 'x-axis')
        .attr('transform', 'translate(0, ' + (height - (mpadding + lpadding)) + ')')

    svg.append('g')
        .call(d3.axisLeft(yScale))
        .attr('id', 'y-axis')
        .attr('transform', 'translate(' + (mpadding + lpadding) + ', ' + (lpadding - mpadding) + ')')

    
    // Defining the tool tip
    var Tooltip = d3.select("#canvas")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("border-color", "darkslateblue")
        .style("padding", "5px")

    var mouseover = function(d) {
        Tooltip
            .style("opacity", 1)
            .transition()
            .duration(250)
        d3.select(this)
            .style("fill", "white")
            .style("opacity", 1)
            .style("stroke", "darkslateblue")
            .style("stroke-width", 2)
            .transition()
            .duration(250)
    }

    var mousemove = function(d) {
        Tooltip
            .html(d.PLAYER + " | " + d.TEAM + "<br>" + d.MIN + " mpg")
            .style("font-family", "montserrat")
            .style("left", (d3.mouse(this)[0]+30) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
            .style("position", "absolute")
    }

    var mouseleave = function(d) {
        Tooltip
            .style("opacity", 0)
            .transition()
            .duration(250)
        d3.select(this)
            .style("fill", "darkslateblue")
            .style("stroke-width", 1)
            .transition()
            .duration(250)
    }

    
    // Drawing points & tool tip
    svg.selectAll('circle')
        .data(data)
        .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('r', 7)
            .attr('data-xvalue', (item) => {
                return item['PTS']
            })
            .attr('data-yvalue', (item) => {
                return item['TSA']
            })
            .attr('cx', (item) => {
                return xScale(item['PTS'])
            })
            .attr('cy', (item) => {
                return yScale(item['TSA'])
            })
            .style('opacity', 0.7)
            .style('fill', 'darkslateblue')
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
})

// Titles and labels
svg.append('text')
    .attr('x', width / 2)
    .attr('y', lpadding)
    .attr('font-size', 30)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'montserrat')
    .attr('font-weight', 800)
    .text(title)
    
svg.append('text')
    .attr('x', width / 2)
    .attr('y', lpadding + mpadding)
    .attr('font-size', 18)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'montserrat')
    .text(subtitle)

svg.append('text')
    .attr('x', (width + lpadding) / 2)
    .attr('y', height - mpadding)
    .attr('font-size', 18)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'montserrat')
    .text(xlab)  

svg.append('text')
    .attr('x', mpadding / 2)
    .attr('y', (height - mpadding + lpadding) / 2)
    .attr('transform', 'rotate(-90, ' + lpadding / 2 + ', ' + (height - mpadding + lpadding) / 2 + ')')
    .attr('font-size', 18)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'montserrat')
    .text(ylab)  