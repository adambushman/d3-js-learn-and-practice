const margins = {
    top: 50, right: 50, left: 50, bottom: 50
}
const dims = {
    height: 1000, width: 1000
}

let svg = d3.select("#tile-map")
    .append("svg")
    .attr("id", "svg-viz")
    .attr("viewBox", `0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}`)
    .append('g')
    .attr("transform", `translate(${margins.left}, ${margins.top})`);

let xScale;
let yScale;
let colorScale;

d3.csv('../Data files/nba-team-stats_2023.csv', 
raw => {
    return {
        team_abbreviation: raw.team_abbreviation, 
        e_net_rating: parseFloat(raw.e_net_rating), 
        e_off_rating: parseFloat(raw.e_off_rating), 
        e_def_rating: parseFloat(raw.e_def_rating), 
        center_coord: parseInt(raw.center_coord),
        x: parseInt(raw.x),
        y: parseInt(raw.y),
        center_x: parseInt(raw.center_x),
        center_y: parseInt(raw.center_y)
    }
}, 
data => {
    console.log(data);

    // Configure plotting rnages
    let domains = [
        [d3.min(data, d => { return d.x }), d3.max(data, d => { return d.x })], 
        [d3.min(data, d => { return d.y }), d3.max(data, d => { return d.y })],
    ];

    let scale = (domains[1][1]-domains[1][0]) / (domains[0][1]-domains[0][0]);

    let range = [
        [0, dims.width], 
        [dims.height - (dims.height * ((1 - scale) / 2)), (dims.height * ((1 - scale) / 2))]
    ]

    // Configure the scales
    xScale = d3.scaleLinear()
        .domain(domains[0])
        .range(range[0]);
        
    yScale = d3.scaleLinear()
        .domain(domains[1])
        .range(range[1]);

    colorScale = d3.scaleLinear()
        .domain([
            d3.min(data, d => { return d.e_net_rating }), 
            d3.max(data, d => { return d.e_net_rating })
        ]) 
        .range(['#023047', '#4cc9f0']);

    // Transform the data
    let new_data = aq.from(data)
        .derive({
            coord: aq.escape(d => [xScale(d.x), yScale(d.y)]), 
            center_coord: aq.escape(d => [xScale(d.center_x), yScale(d.center_y)])
        })
        .groupby(['team_abbreviation', 'e_net_rating', 'e_off_rating', 'e_def_rating', 'center_coord'])
        .rollup({
            points: d => op.array_agg(d.coord)
        })
        .objects();

    console.log(new_data);

    var line = d3.line()
        .curve(d3.curveLinearClosed);
    
    svg.selectAll("path")
        .data(new_data)
        .enter()
        .append("path")
        .attr("class", "shapes")
        .attr("d", d => {
            return line(d.points);
        })
        .attr("fill", d => { return colorScale(d.e_net_rating) });

    svg.selectAll("text")
        .data(new_data)
        .enter()
        .append("text")
        .attr("class", "teams")
        .attr('x', d => { return d.center_coord[0]; })
        .attr('y', d => { return d.center_coord[1]; })
        .text(d => { return d.team_abbreviation; });
})