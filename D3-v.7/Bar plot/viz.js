const state = {
    data: [], 
    metric: "ts_perc"
    // e.g., user selection
}

function getFilters() {
    return(state.metric = document.getElementById("fg-perc-radio").checked ? "fg_perc" : "ts_perc");
}

function filterData(data) {
    // filter the raw data according to user selection
    return(data);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    let adjusted = aq.from(filtered)
        .orderby(aq.desc(state.metric))
        .objects();
    return(adjusted);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    const dims = {
        height: 800, 
        width: 600
    }
    const margins = {
        top: 25, 
        left: 150, 
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

    let xAxis = d3.axisBottom().scale(xScale);
    let yAxis = d3.axisLeft().scale(yScale);
    
    let g_xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + dims.height + ')');
    let g_yAxis = svg.append("g").attr("class", "y-axis");

    function update(new_data) {
        // updates the specific visualization with the given data
        xScale.domain([
            d3.min(new_data, d => { return d[state.metric]; }) - 0.01,
            d3.max(new_data, d => { return d[state.metric]; })
        ]);
        yScale.domain(d3.map(state.data, d => { return d.athlete_display_name; }));

        g_xAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(xAxis);
        g_yAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(yAxis);

        let rect = svg.selectAll("rect")
            .data(new_data)
            .join(
                (enter) => {
                    let rect_enter = enter.append("rect")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("height", 0);
                    
                        return rect_enter;
                }, 
                (update) => update,
                (exit) => exit.remove()
            );

        rect.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .attr("y", (d) => yScale(d.athlete_display_name) + yScale.bandwidth() * 0.15)
            .attr("height", yScale.bandwidth() * 0.7)
            .attr("width", (d) => xScale(d[state.metric]) + 1)
            .attr("x", 1)
            .style("fill", "#684756");

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
d3.select("#fg-perc-radio").on('click', () => {
    // update state
    updateApp();
})

d3.select("#ts-perc-radio").on('click', () => {
    // update state
    updateApp();
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