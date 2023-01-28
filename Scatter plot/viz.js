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

let svg = d3.select('svg')

let drawCanvas = () => {
    svg.attr('width', width)
    svg.attr('height', height)
}

let generateScales = (values) => {
    xScale = d3
        .scaleLinear()
        .domain([
            d3.min(values, (item) => { return item['PTS'] * 0.98}), 
            d3.max(values, (item) => { return item['PTS'] * 1.02})
        ])
        .range([lpadding + mpadding, width - mpadding])
    
    yScale = d3
        .scaleLinear()
        .domain([
            d3.min(values, (item) => { return item['TSA'] * 0.98}), 
            d3.max(values, (item) => { return item['TSA'] * 1.02})
        ])
        .range([height - tpadding, lpadding + mpadding])
}

let drawPoints = (values) => {
    svg.selectAll('circle')
        .data(values)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', '7')
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
}

let generateAxes = (values) => {
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

drawCanvas()

d3.csv('data.csv', (d) => { 
    generateScales(d)
    drawPoints(d)
    generateAxes(d)
})



