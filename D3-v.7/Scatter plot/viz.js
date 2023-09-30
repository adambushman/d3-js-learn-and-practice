// Global variables
const state = {
    data: [], 
    selections: {
        x_metric: "median_length", 
        y_metric: "median_width", 
        size_metric: "total_boats"
    }, 
    dims: {height: 700, width: 1000}, 
    margins: {left: 75, bottom: 75, top: 50, right: 75}
}

// Mouse events
const mouseover = (e,d) => {
    const name = d["Boat Type"].replace(" ", "-");

    d3.selectAll(`.circles circle`)
        .filter(c => { return c["Boat Type"] != d["Boat Type"] })
        .transition()
        .duration(250)
        .style("fill-opacity", 0.15)
        .style("stroke-opacity", 0.4);

    d3.select(`.${name}-label`)
        .transition()
        .duration(250)
        .style("fill", "black")
        .text(d["Boat Type"]);
}

const mousemove = (e,d) => {

}

const mouseleave = (e,d) => {
    const name = d["Boat Type"].replace(" ", "-");

    d3.selectAll(`.circles circle`)
        .filter(c => { return c["Boat Type"] != d["Boat Type"] })
        .transition()
        .duration(250)
        .style("fill-opacity", 0.65)
        .style("stroke-opacity", 1);

    d3.select(`.${name}-label`)
        .transition()
        .duration(250)
        .text("");
}

// Function to pull selections from UI
function pullSelections() {
    state.selections.x_metric = document.getElementById("x-metric-select").value;
    state.selections.y_metric = document.getElementById("y-metric-select").value;
    state.selections.size_metric = document.getElementById("size-metric-select").value;
}

// Filter the raw data according to user selection
function filterData() {
    const filtered = aq.from(state.data)
        .filter(d => !op.includes(d["Boat Type"], ",") & d.Price != '')
        .objects();

    return filtered;
}

// Wrangle data based on structure
function wrangleData(filtered) {
    const wrangled = aq.from(filtered)
        .derive({
            lengthInFt: d => op.parse_float(d.Length) * 3.281, 
            widthInFt: d => op.parse_float(d.Width) * 3.281, 
            currency: d => op.trim(op.match(d.Price, "^([^0-9\s]+)", 1)), 
            realPrice: d => op.parse_float(op.match(d.Price, / (.+)/, 1))
        })
        .derive({
            priceUSD: d => {
                if (d.currency == "EUR") {
                    return d.realPrice * 1.06;
                } else if (d.currency == "CHF") {
                    return d.realPrice * 1.09;
                } else if (d.currency == "Â£") {
                    return d.realPrice * 1.22;
                } else if (d.currency == "DKK") {
                    return d.realPrice * 0.14;
                }
            }
        })
        .groupby("Boat Type")
        .rollup({
            total_boats: d => op.count(), 
            median_price: d => op.median(d.priceUSD), 
            median_length: d => op.median(d.lengthInFt), 
            median_width: d => op.median(d.widthInFt), 
            total_views: d => op.sum(d["Number of views last 7 days"])
        })
        .objects();

    return wrangled;
}

// Visualization logic
function createVis() {
    // Setup vis structure: SVG, scales, etc.

    const dims = state.dims;
    const margins = state.margins;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("id", "chart-svg")
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    const size = d3.scaleLinear()
        .range([5, 35]);

    const color = d3.scaleOrdinal(d3.schemeSet1);

    const xScale = d3.scaleLinear()
        .range([0, dims.width]);

    const yScale = d3.scaleLinear()
        .range([dims.height, 0]);

    const xAxis = d3.axisBottom()
        .scale(xScale);
        
    const yAxis = d3.axisLeft()
        .scale(yScale);

    let g_xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + dims.height + ')');

    let g_yAxis = svg.append("g")
        .attr("class", "y-axis");

    const text_features = svg.append("g")
        .attr("class", "text-features");

    const label_lookup = {
        median_length: "Median Length", 
        median_price: "Median Price in USD", 
        total_boats: "Total Boats", 
        median_width: "Median Width", 
        total_views: "Total Views"
    }

    let xaxis_label = text_features.append("text")
        .attr("class", "x-label")
        .attr("x", (dims.width - margins.left) / 2)
        .attr("y", dims.height + margins.top)
        .style("font-size", "1.5rem")
        .text("");

    let yaxis_label = text_features.append("text")
        .attr("class", "y-label")
        .attr("x", margins.left * -4 / 5)
        .attr("y", margins.top * -1 / 2)
        .style("text-anchor", "center")
        .style("font-size", "1.5rem")
        .text("");

    const circles = svg.append("g").attr("class", "circles");
    const labels = svg.append("g").attr("class", "labels");

    function update(new_data) {
        // Joins data to elements, specifying enter, update, exit logic
        size.domain([
            d3.min(new_data, d => d[state.selections.size_metric]), 
            d3.max(new_data, d => d[state.selections.size_metric])
        ]);

        color.domain(
            d3.map(new_data, d => d["Boat Type"]).keys()
        );

        xScale.domain([
            d3.min(new_data, d => d[state.selections.x_metric]) * 0.8, 
            d3.max(new_data, d => d[state.selections.x_metric]) * 1.05
        ])

        yScale.domain([
            d3.min(new_data, d => d[state.selections.y_metric]) * 0.8, 
            d3.max(new_data, d => d[state.selections.y_metric]) * 1.05
        ])

        g_xAxis.style("font-size", "0.9rem").transition().duration(1500).call(xAxis);
        g_yAxis.style("font-size", "0.9rem").transition().duration(1500).call(yAxis);

        xaxis_label.text(label_lookup[state.selections.x_metric]);
        yaxis_label.text(label_lookup[state.selections.y_metric]);

        circles.selectAll("circle")
            .data(new_data)
            .join(
                (enter) => {
                    enter
                        .append("circle")
                        .attr("class", d => `${d["Boat Type"].replace(" ", "-")}-circle`)
                        .style("fill", "#ff6b6b")
                        .style("stroke", "#ff6b6b")
                        .style("stroke-width", 2)
                        .style("fill-opacity", 0.65)
                        .on("mouseover", (e,d) => mouseover(e,d))
                        .on("mousemove", (e,d) => mousemove(e,d))
                        .on("mouseleave", (e,d) => mouseleave(e,d))
                        .transition()
                        .duration(1500)
                        .attr("cx", d => xScale(d[state.selections.x_metric]))
                        .attr("cy", d => yScale(d[state.selections.y_metric]))
                        .attr("r", d => size(d[state.selections.size_metric]));
                }, 
                (update) => {
                    update
                        .transition()
                        .duration(1500)
                        .attr("cx", d => xScale(d[state.selections.x_metric]))
                        .attr("cy", d => yScale(d[state.selections.y_metric]))
                        .attr("r", d => size(d[state.selections.size_metric]));
                }, 
                (exit) => exit.remove()
            );

        labels.selectAll("text")
            .data(new_data)
            .join(
                (enter) => {
                    enter
                        .append("text")
                        .attr("class", d => `${d["Boat Type"].replace(" ", "-")}-label`)
                        .attr("x", d => xScale(d[state.selections.x_metric]))
                        .attr("y", d => yScale(d[state.selections.y_metric]) - size(d[state.selections.size_metric]) - 15)
                        .style("text-anchor", "middle")
                        .style("font-size", "1.5rem")
                        .style("font-weight", "bold");
                }, 
                (update) => {
                    update
                    .attr("x", d => xScale(d[state.selections.x_metric]))
                    .attr("y", d => yScale(d[state.selections.y_metric]) - size(d[state.selections.size_metric]) - 15);
                }, 
                (exit) => exit.remove()
            );
    }

    // Return the update function to be called later
    return update;
}
  
// Create an instance of the visualization
const vis = createVis();

// Update the application based on new data via event handlers
function updateApp() {
    pullSelections();

    // Generate new data from updated parameters
    const filtered = filterData();
    const new_data = wrangleData(filtered);

    // Update visualization
    vis(new_data);
}
  
// Initialize even handlers
const ui_elements = [
    "x-metric-select", 
    "y-metric-select", 
    "size-metric-select"
];

ui_elements.forEach(e => {
    document.getElementById(e).addEventListener('change', () => {
        // Update state
        updateApp();
    })
})


// Load data files
d3.csv("../../Data files/boat_data.csv")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        pullSelections();
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });