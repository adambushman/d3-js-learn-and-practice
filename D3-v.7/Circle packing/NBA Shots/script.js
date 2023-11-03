// Global variables
const state = {
    shapes_data: [], 
    shooting_data: [], 
    dims: {
        width: 500, height: 500, 
        top: 0, left: 0, right: 0, bottom: 0
    }, 
    locations: ["Rim", "Midrange", "Corner3", "AboveBreak3"]
}

let xScale, yScale, colorScale, r_size;

function mouseover(d) {
    Tooltip.classed("visually-hidden", false)
        .style("opacity", 1);

    const target = d.target.parentElement.parentElement;
    d3.select(target)
        .transition().duration(250)
        .style("fill-opacity", 0.9);

    d3.selectAll(".packed-circle")
        .filter(c => c.Abb != target.id)
        .transition().duration(250)
        .style("fill-opacity", 0.3);
}

function mousemove(d) {
    const target = d.target.parentElement.parentElement.__data__;
    
    let html = `<h5>${target.FullName}</h5>`;
    target.data.forEach(d => {
        html += `<p class='m-0 mt-1 px-2 py-1 rounded fw-bold' style='opacity: 0.9; background-color:${colorScale(d.loc)}'>${d.loc}: ${d3.format(".0%")(d.val)}</p>`
    });
    Tooltip.html(html);

    const [new_x, new_y] = tooltipPosition(xScale(target.center_x), yScale(target.center_y));

    Tooltip
        .style("top", new_y)
        .style("left", new_x);
}

function mouseleave(d) {
    Tooltip.classed("visually-hidden", true)
        .style("opacity", 0);

    d3.selectAll(".packed-circle")
        .transition().duration(250)
        .style("fill-opacity", 0.6);
}

// Wrangle data based on structure
function wrangleData() {
    const cleaned = aq.from(state.shapes_data)
        .groupby(["team_abbreviation", "center_x", "center_y"])
        .rollup({count: d => op.count()})
        .join(
            aq.from(state.shooting_data), 
            ["team_abbreviation", "Abb"]
        )
        .fold(
            ["Rim", "Midrange", "Corner3", "AboveBreak3"], 
            {as: ['Location', 'Value']}
        )
        .derive({
            Value: aq.escape(d => parseFloat(d.Value)), 
            center_x: aq.escape(d => parseInt(d.center_x)), 
            center_y: aq.escape(d => parseInt(d.center_y))
        })
        .groupby(['Abb', 'FullName'])
        .derive({Total: d => op.sum(d.Value)})
        .derive({Rate: d => d.Value / d.Total})
        .select(["Abb", "FullName", "Location", "Rate", 'center_x', 'center_y'])
        .groupby(['Abb', 'FullName', 'center_x', 'center_y'])
        .rollup({data: d => op.array_agg({val: d.Rate, loc: d.Location})})
        .objects();
    
    return cleaned;
}

// Filter the raw data according to user selection
function filterData(filtered) {
    return filtered;
}

// Visualization logic
function createVis() {
    // Setup vis structure: SVG, scales, etc.
    const svg = d3.select("#viz")
        .append("svg")
        .attr("id", "viz-svg")
        .attr("viewBox", `0 0 ${state.dims.width} ${state.dims.height}`)
        .append("g")
        .attr("transform", `translate(${state.dims.left},${state.dims.top})`);

    colorScale = d3.scaleOrdinal()
        .domain(["Rim", "Midrange", "Corner3", "AboveBreak3"])
        .range(["#ECC30B", "#3C91E6", "#FF7F11", "#8FC93A"]);

    const legend = svg.append("g")
        .attr("class", "legend");

    xScale = d3.scaleLinear();
        
    yScale = d3.scaleLinear();
    
    legend.selectAll()
        .data(state.locations)
        .join(
            (enter) => {
                enter.append("circle")
                    .attr("cx", 25)
                    .attr("cy", (d,i) => state.dims.height - ((i+1) * 25) - 50)
                    .style("fill", (d) => colorScale(d))
                    .style("stroke", "gray")
                    .style("stroke-width", 0.5)
                    .style("fill-opacity", 0.5)
                    .transition().duration(750)
                    .attr("r", 10);

                enter.append("text")
                    .attr("x", 38)
                    .attr("y", (d,i) => state.dims.height - ((i+1) * 25) - 46)
                    .style("font-size", "0.65rem")
                    .style("opacity", 0)
                    .text(d => d)
                    .transition().duration(750)
                    .style("opacity", 1);
            }
        );

    function update(new_data) {
    // Joins data to elements, specifying enter, update, exit logic
        r_size = 14;
    
        let domains = [
            [d3.min(new_data, d => { return d.center_x }) - r_size, d3.max(new_data, d => { return d.center_x }) + r_size], 
            [d3.min(new_data, d => { return d.center_y }) - r_size, d3.max(new_data, d => { return d.center_y }) + r_size],
        ];

        let scale = (domains[1][1]-domains[1][0]) / (domains[0][1]-domains[0][0]);

        let range = [
            [0, state.dims.width], 
            [state.dims.height - (state.dims.height * ((1 - scale) / 2)), (state.dims.height * ((1 - scale) / 2))]
        ];

        xScale.domain(domains[0])
            .range(range[0]);
            
        yScale.domain(domains[1])
            .range(range[1]);

        svg.append("g")
            .attr("class", "circles")
            .selectAll()
            .data(new_data)
            .join(
                (enter) => {
                    const pack = d3.pack().size([r_size * 1.5 * 2,r_size * 1.5 * 2]).padding(0);

                    const circle_pack = enter.append("g")
                        .attr("id", d => d.Abb)
                        .attr("class", "packed-circle")
                        .style("fill-opacity", 0.6)
                        .attr("transform", d => `translate(${xScale(d.center_x) - (r_size * 1.5)},${yScale(d.center_y) - (r_size * 1.5)})`)
                        .on("mouseover", mouseover)
                        .on("mousemove", mousemove)
                        .on("mouseleave", mouseleave);
                    
                    const nodes = circle_pack.selectAll()
                        .data(d => pack(d3.hierarchy({children: d.data}).sum(dd => dd.val)).leaves())
                        .join("g")
                        .attr("transform", dd => `translate(${dd.x},${dd.y})`);
        
                    nodes.append("circle")
                        .style("stroke", "gray")
                        .style("stroke-width", 0.5)
                        .style("fill", dd => colorScale(dd.data.loc))
                        .transition().duration(750)
                        .attr("r", dd => dd.r);
                        
                    enter.append("circle")                    
                        .style("stroke", "gray")
                        .style("stroke-width", 1)
                        .style("fill", "none")
                        .attr("cx", d => xScale(d.center_x))
                        .attr("cy", d => yScale(d.center_y))
                        .transition().duration(750)
                        .attr("r", r_size * 1.5);

                    enter.append("text")
                        .style("text-anchor", "middle")
                        .style("font-size", "0.7rem")
                        .style("opacity", 0)
                        .attr("x", d => xScale(d.center_x))
                        .attr("y", d => yScale(d.center_y) - (r_size * 1.7))
                        .text(d => d.Abb)
                        .transition().duration(750)
                        .style("opacity", 1)
                }, 
                (update) => update, 
                (exit) => exit.remove()
            )

    }

    // Return the update function to be called later
    return update;
}
  
// Create an instance of the visualization
const vis = createVis();

// Update the application based on new data via event handlers
function updateApp() {
    // Generate new data from updated parameters
    const wrangled = wrangleData();
    const filtered = filterData(wrangled);

    // Update visualization
    vis(filtered);
}


// Load data files
d3.csv('../../../Data files/nba-team-shooting.csv')
    .then((shooting) => {
        d3.csv('../../../Data files/nba-team-stats_2023.csv')
            .then((shapes) => {
                // The 'data' variable contains an array of data from all the CSV files
                // You can process and visualize the data here
                state.shapes_data = shapes;
                state.shooting_data = shooting;

                const wrangled = wrangleData();
                const filtered = filterData(wrangled);

                vis(filtered);
            })
            .catch((error) => {
                console.error('Error loading shape file', error);
            });    
    })
    .catch((error) => {
        console.error('Error loading shooting file', error);
    });



// Tooltip definition
let Tooltip = d3.select("#viz")
    .append("div")
    .attr("id", "tt")
    .attr("class", "tooltip visually-hidden")
    .style("opacity", 0)
    .style("color", "#424041")
    .style("background-color", "#FFFFFF")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("border-color", "gray")
    .style("padding", "8px 10px")
    .style("box-shadow", "0px 0px 5px 0.5px #D6D6D6")
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px");


// Getting tooltip position, accounting for dynamic screens

function tooltipPosition(val_x, val_y) {
    // Variables to use in the calculation
    let offset = document.getElementById("viz");
    let tt = document.getElementById("tt").getBoundingClientRect();
    let vbSize = document.getElementById("viz-svg").getBoundingClientRect();
    let vbScale = {
        x: vbSize.width / (state.dims.width + state.dims.left + state.dims.right), 
        y: vbSize.height / (state.dims.height + state.dims.top + state.dims.bottom)
    };

    return([
        // X coordinate
        (val_x * vbScale.x) // Adjusted for viewbox scale
        +  offset.offsetLeft // SVG offset from edge of screen
        + (vbScale.x * state.dims.left) // Left margin adjusted for viewbox scale
        - (tt.width / 2) // Center align tooltip to point
        , 
        // Y coordinate
        (val_y * vbScale.y) // Adjusted for viewbox scale
        + offset.offsetTop // SVG offset from top of screen
        + (vbScale.y * state.dims.top) // Top margin adjusted for viewbox scale
        - (r_size * 2.5 * vbScale.y)
        - tt.height // Align tooltip above the point
    ])
}