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


// Get filters function

function getFilters() {
    let metricF = document.getElementById('metric-filt');
    let metricR = metricF[metricF.value].text;
    if(metricR == 'Net Rating') {
        metricR = 'e_net_rating';
    } else if(metricR == 'Off Rating') {
        metricR = 'e_off_rating';
    } else if(metricR == 'Def Rating') {
        metricR = 'e_def_rating';
    }
    
    return {
        metric: metricR
    }
}

// Custom color function

function getColor(data, metric, d) {
    let colors = ['#023047', '#4cc9f0'];
    colorScale = d3.scaleLinear()
        .domain([
            d3.min(data, d => { return d[metric] }), 
            d3.max(data, d => { return d[metric] })
        ]) 
        .range(['e_def_rating'].includes(metric) ? colors.reverse() : colors);

    return(colorScale(d));
}


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

    // Current filters
    let curr_filt = getFilters();

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
        .attr("fill", d => { return getColor(new_data, curr_filt.metric, d[curr_filt.metric]) });

    svg.selectAll("text")
        .data(new_data)
        .enter()
        .append("text")
        .attr("class", "teams")
        .attr('x', d => { return d.center_coord[0]; })
        .attr('y', d => { return d.center_coord[1]; })
        .text(d => { return d.team_abbreviation; });
})

function update() {
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
        // Current filters
        let curr_filt = getFilters();
        console.log(curr_filt);

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
            
        let newStuff = svg.selectAll("path").data(new_data);

        newStuff.merge(newStuff)
            .transition()
            .duration(500)
            .ease(d3.easeSin)
            .attr("fill", d => { return getColor(new_data, curr_filt.metric, d[curr_filt.metric]) });
    })
}

document.getElementById('metric-filt').addEventListener('change', () => {
    update();
});