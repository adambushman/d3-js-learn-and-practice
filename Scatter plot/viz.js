let values = []

let xScale
let yScale

let width = 800
let height = 500
let mpadding = 20
let lpadding = 50
let tpadding = 100

let svg = d3.select('svg')

let drawCanvas = () => {
    svg.attr('width', width)
    svg.attr('height', height)
}

let generateScales = () => {
    xScale = d3
        .scaleLinear()
        .range([lpadding + mpadding, width - mpadding])
    
    yScale = d3
        .scaleLinear()
        .range([height - tpadding, lpadding + mpadding])
}

let drawPoints = () => {
    svg.selectAll('circle')
        .data(values)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', '7')
        .attr('data-xvalue', (item) => {
            return item
        })
        .attr('data-yvalue', (item) => {
            return item
        })
}

let generateAxes = () => {
    let xAxis = d3
        .axisBottom(xScale)
    
    let yAxis = d3
        .axisLeft(yScale)

    svg.append('g')
        .call(xAxis)
        .attr('id', 'x-axis')
        .attr('transform', 'translate(0, ' + (height - (mpadding + lpadding)) + ')')

    svg.append('g')
        .call(yAxis)
        .attr('id', 'y-axis')
        .attr('transform', 'translate(' + (mpadding + lpadding) + ', ' + (lpadding - mpadding) + ')')
}


d3.csv('./data.csv', function(data) {
    values = data
    console.log(values)

    drawCanvas()
    generateScales()
    drawPoints()
    generateAxes()
})
