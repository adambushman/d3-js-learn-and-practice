
const parseDate = d3.timeParse("%Y-%m-%d");
const drawPathTransition = d3.transition()
    .duration(3500)
    .ease(d3.easeSin);
let margin = {left: 75, right: 25, top: 175, bottom: 100}
let dims = {width: 1000, height: 600};

let svg;
let xScale;
let yScale;
let filterData;

// Function to get the filter values

function getFilters() {
    let player_f = document.getElementById('player-filt');
    let metric_f = document.getElementById('metric-filt');

    metric_f = metric_f[metric_f.value].text == 'Per game' ? 'total' : 'roll';

    return({
        player: player_f[player_f.value].text, 
        metric: metric_f
    })
}

// Function to filter the data
function getNewData(data) {
    filterData = getFilters();
    newData = aq.from(data)
        .filter(aq.escape(
            d => d.name == filterData.player & !isNaN(d[filterData.metric])
        ))
        .objects();

    return(newData);
}

// Function to generate a y scale
function genYScale(data) {
    scale <- d3.scaleLinear()
        .domain([
            d3.min(data, (d) => { return d[filterData.metric] }), 
            d3.max(data, (d) => { return d[filterData.metric] })
        ])
        .range([ dims.height, 0 ])

    return(scale)
}

// Function to coordinate the data viz

function coordinateViz() {
    d3.csv('../Data files/game_points.csv', 
        raw => {
            return({
                game_date: parseDate(raw.game_date), 
                headshot: raw.headshot, 
                name: raw.name, 
                total: parseInt(raw.total), 
                roll: parseInt(raw.roll)
            })
        }, 
        data => {
            console.log(data);

            // Filter data
            newData = getNewData(data);

            // Draw the canvas
            drawCanvas(newData);

            // Draw the lines
            drawLines(newData);

            // Render the text
            renderText(newData);
    });
}

// Function to draw the canvas

function drawCanvas(data) {
    // Drawing the canvas

    svg = d3.select('#line-plot')
        .append('svg').attr('id', 'svg-viz')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr('viewBox', `0 0 
            ${dims.width + margin.left + margin.right} 
            ${dims.height + margin.top + margin.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Defining the axis scales

    xScale = d3.scaleTime()
        .domain(d3.extent(data, (d) => { return d.game_date}))
        .range([ 0, dims.width ]);

    yScale = d3.scaleLinear()
        .domain([
            0, d3.max(data, (d) => { return d[filterData.metric] })
        ])
        .range([ dims.height, 0 ]);

    // Plotting the axes

    svg.append("g")
        .attr("transform", "translate(0, " + dims.height + ")")
        .attr("id", "xaxis")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("id", "yaxis")
        .call(d3.axisLeft(yScale));
}

// Function to draw the lines

function drawLines(data) {
    // Draw the lines

    let path = svg.append("path")
        .attr("id", "line-path")
        .interrupt()
        .datum(data)
        .attr("d", d3.line()
            .x((d) => { return xScale(d.game_date) })
            .y((d) => { return yScale(d[filterData.metric]) })
        );

    // Defining the transition

    let pathLength = path.node().getTotalLength();

    path.attr('stroke-dashoffset', -pathLength)
        .attr('stroke-dasharray', pathLength)
        .transition(drawPathTransition)
        .attr('stroke-dashoffset', 0);

    d3.select('#headshot')
        .attr('src', data[0].headshot);
}

function renderText(data) {
    svg.append("text")
        .attr("id", "title")
        .attr("x", (margin.left / -2))
        .attr("y", margin.top * 5 / -9)
        .text(`${data[0].name} scoring trend`);

    let metric_f = document.getElementById('metric-filt');
    let metric_text = (metric_f[metric_f.value].text);

    svg.append("text")
        .attr("id", "subtitle")
        .attr("x", (margin.left / -2))
        .attr("y", margin.top * 2 / -7)
        .text(`${metric_text} points | 2022-23 regular season + tournament`);
}

function updateData(data) {
    d3.csv('../Data files/game_points.csv', 
        raw => {
            return({
                game_date: parseDate(raw.game_date), 
                headshot: raw.headshot, 
                name: raw.name, 
                total: parseInt(raw.total), 
                roll: parseInt(raw.roll)
            })
        }, 
        data => {
            // Filter data
            newData = getNewData(data);

            // Update the text
            d3.select("#title")
                .transition()
                .duration(1500)
                .ease(d3.easeSin)
                .text(`${newData[0].name} scoring trend`);

            let metric_f = document.getElementById('metric-filt');
            let metric_text = (metric_f[metric_f.value].text);

            d3.select("#subtitle")
                .transition()
                .duration(1500)
                .ease(d3.easeSin)
                .text(`${metric_text} points | 2022-23 regular seson + tournament`);

            // Update the axes
            yScale = d3.scaleLinear()
                .domain([
                    0, d3.max(newData, (d) => { return d[filterData.metric] })
                ])
                .range([ dims.height, 0 ]);
            
            d3.select("#yaxis")
                .transition()
                .duration(1500)
                .ease(d3.easeSin)
                .call(d3.axisLeft(yScale));

            // Update the photo
            d3.select('#headshot')
                .attr('src', newData[0].headshot);

            // Update the lines
            let curr_path = d3.select("#line-path").datum(newData);
            curr_path
                .merge(curr_path)
                .transition()
                .duration(1500)
                .ease(d3.easeSin)
                .attr("d", d3.line()
                    .x((d) => { return xScale(d.game_date) })
                    .y((d) => { return yScale(d[filterData.metric]) })
                );
    });
}

coordinateViz();

document.getElementById('player-filt').addEventListener('change', () => {
    updateData();
});

document.getElementById('metric-filt').addEventListener('change', () => {
    updateData();
});