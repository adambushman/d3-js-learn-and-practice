const state = {
    data: [], 
    metric: "fg_perc"
    // e.g., user selection
}

function getFilters() {
    state.metric = document.getElementById("fg-perc-radio").checked ? "fg_perc" : "ts_perc";
}

function filterData(data) {
    // filter the raw data according to user selection
    return(data);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    let adjusted = aq.from(filtered)
        .orderby('athlete_display_name')
        .objects();
    return(adjusted);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    const dims = {
        height: 800, 
        width: 700
    }
    const margins = {
        top: 25, 
        left: 175, 
        bottom: 25, 
        right: 25
    }

    getFilters();
    let svg = d3.select(selector)
        .append("svg")
        .attr("id", `${selector}-svg`)
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    let xScale = d3.scaleLinear()
        .range([0, dims.width]);

    let yScale = d3.scaleBand()
        .range([0, dims.height]);

    let xAxis = d3.axisBottom().scale(xScale).ticks(5).tickFormat(x => d3.format(".0%")(x));
    let yAxis = d3.axisLeft().scale(yScale);
    
    let g_xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + dims.height + ')');

    let g_yAxis = svg.append("g").attr("class", "y-axis");

    function update(new_data) {
        // updates the specific visualization with the given data
        getFilters();

        xScale.domain([
            d3.min(new_data, d => { return d[state.metric]; }) * 0.95,
            d3.max(new_data, d => { return d[state.metric]; }) * 1.05
        ]);

        yScale.domain(d3.map(new_data, d => { return d.athlete_display_name; }));

        g_xAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(xAxis);

        g_yAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(yAxis);

        svg.selectAll("rect")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("rect")
                        .attr("x", 0)
                        .attr("y", (d) => yScale(d.athlete_display_name) + yScale.bandwidth() * 0.15)
                        .attr("height",  yScale.bandwidth() * 0.7)
                        .style("fill", "#684756")
                        .transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("width", (d) => xScale(d[state.metric]));
                }, 
                (update) => {
                    update.transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("width", (d) => xScale(d[state.metric]));
                },
                (exit) => exit.remove()
            );

        return update;
    }

    // return the update function to be called
    return update;
}

// create a specific instance
const vis = createVis("#chart");

function updateApp() {
    // updates the application
    getFilters();
    const filtered = filterData(state.data);
    const new_data = wrangleData(filtered);

    // update visualization
    vis(new_data);
}

// init interaction, e.g., listen to click events
["fg-perc-radio", "ts-perc-radio"].forEach(e => {
    d3.select(`#${e}`).on('click', () => {
        // update state
        updateApp();
    })
})

d3.csv("../../Data files/fg_ts_example.csv")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });