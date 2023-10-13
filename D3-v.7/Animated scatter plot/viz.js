// Global variables
const state = {
    data: [], 
    years: [], 
    selections: {
        year: 1926, 
        sex: "F"
    }, 
    dims: {height: 700, width: 1000}, 
    margins: {left: 75, bottom: 75, top: 50, right: 75}
}

// Mouse events
const mouseover = (e,d) => {
    d3.selectAll(`.circles circle`)
        .filter(c => { return c.Team != d.Team })
        .transition()
        .duration(250)
        .style("fill-opacity", 0.15)
        .style("stroke-opacity", 0.4);

    d3.selectAll(`.labels text`)
        .filter(c => { return c.Team != d.Team })
        .transition()
        .duration(250)
        .style("fill-opacity", 0.5);
}

const mousemove = (e,d) => {

}

const mouseleave = (e,d) => {
    d3.selectAll(`.circles circle`)
        .filter(c => { return c.Team != d.Team })
        .transition()
        .duration(250)
        .style("fill-opacity", 0.65)
        .style("stroke-opacity", 1);

        d3.selectAll(`.labels text`)
        .filter(c => { return c.Team != d.Team })
        .transition()
        .duration(250)
        .style("fill-opacity", 1);
}

// Function to pull selections from UI
function pullSelections() {
    state.selections.year = document.getElementById("year-range").value;
}

// Filter the raw data according to user selection
function filterData() {
    const filtered = aq.from(state.data)
        .filter(aq.escape(d => d.Year <= state.selections.year & d.Year >= 1924 & d.Sex == state.selections.sex))
        .objects();

    return filtered;
}

// Wrangle data based on structure
function wrangleData(filtered) {
    const wrangled = aq.from(filtered)
        .derive({Team: d => op.match(d.Team, '^([^-]+)')[0]})
        .groupby("Team")
        .derive({athlete_count: d => op.distinct(d.ID)})
        .filter(d => d.Medal != "NA")
        .groupby("Team")
        .rollup({
            athlete_count: d => op.median(d.athlete_count), 
            summer_medals: d => op.sum(d.Season == "Summer" ? 1 : 0), 
            winter_medals: d => op.sum(d.Season == "Winter" ? 1 : 0)
        })
        .derive({total_medals: d => d.summer_medals + d.winter_medals})
        .orderby(aq.desc('total_medals'))
        .slice(0,15)
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
    const yearLabel = svg.append("text")
        .attr("x", dims.width - margins.right)
        .attr("y", margins.top)
        .style("text-anchor", "end")
        .style("font-size", "3.5rem")
        .style("font-weight", "bold")
        .style("opacity", 0.25);

    function update(new_data) {
        console.log(new_data);
        // Joins data to elements, specifying enter, update, exit logic
        size.domain([
            d3.min(new_data, d => d.athlete_count), 
            d3.max(new_data, d => d.athlete_count)
        ]);

        color.domain(
            d3.map(new_data, d => d["Boat Type"]).keys()
        );

        xScale.domain([
            d3.min(new_data, d => d.summer_medals), 
            d3.max(new_data, d => d.summer_medals) * 1.05
        ]);

        yScale.domain([
            d3.min(new_data, d => d.winter_medals), 
            d3.max(new_data, d => d.winter_medals) * 1.05
        ]);

        g_xAxis.style("font-size", "0.9rem").transition().duration(750).call(xAxis);
        g_yAxis.style("font-size", "0.9rem").transition().duration(750).call(yAxis);

        //xaxis_label.text(label_lookup[state.selections.x_metric]);
        //yaxis_label.text(label_lookup[state.selections.y_metric]);

        circles.selectAll("circle")
            .data(new_data, d => d.Team.replace(" ", "-"))
            .join(
                (enter) => {
                    enter
                        .append("circle")
                        .attr("class", d => `${d.Team.replace(" ", "-")}-circle`)
                        .style("fill", "#05668D")
                        .style("stroke", "#05668D")
                        .style("stroke-width", 2)
                        .style("fill-opacity", 0.65)
                        .on("mouseover", (e,d) => mouseover(e,d))
                        .on("mousemove", (e,d) => mousemove(e,d))
                        .on("mouseleave", (e,d) => mouseleave(e,d))
                        .transition()
                        .duration(750)
                        .attr("cx", d => xScale(d.summer_medals))
                        .attr("cy", d => yScale(d.winter_medals))
                        .attr("r", d => size(d.athlete_count));
                }, 
                (update) => {
                    update
                        .transition()
                        .duration(750)
                        .attr("cx", d => xScale(d.summer_medals))
                        .attr("cy", d => yScale(d.winter_medals))
                        .attr("r", d => size(d.athlete_count));
                }, 
                (exit) => exit.remove()
            );

        labels.selectAll("text")
            .data(new_data, d => d.Team.replace(" ", "-"))
            .join(
                (enter) => {
                    enter
                        .append("text")
                        .attr("class", d => `labels ${d.Team.replace(" ", "-")}-label`)
                        .style("text-anchor", "middle")
                        .style("font-size", "1rem")
                        .style("fill", "transparent")
                        .text(d => d.Team)
                        .transition().duration(750)
                        .style("fill", "black")
                        .attr("x", d => xScale(d.summer_medals))
                        .attr("y", d => yScale(d.winter_medals) - size(d.athlete_count) - 15);
                }, 
                (update) => {
                    update
                        .transition().duration(750)
                        .attr("x", d => xScale(d.summer_medals))
                        .attr("y", d => yScale(d.winter_medals) - size(d.athlete_count) - 15);
                }, 
                (exit) => exit.remove()
            );

        yearLabel
            .transition().duration(750)
            .text(state.selections.year);
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

const animate = () => {
    const animationInterval = setInterval(changeYear, 1000);
    const startButton = document.getElementById("animate-viz");
    startButton.disabled = true;

    // Stop the animation after a certain duration
    setTimeout(() => {
        clearInterval(animationInterval); // Stop the animation
        startButton.disabled = false; // Enable the button
    }, (state.years.length - 1) * 1000); // Length
}

const changeYear = () => {
    const indx = state.years.indexOf(parseInt(state.selections.year));
    state.selections.year = parseInt(state.years[indx + 1]);
    document.getElementById("year-range").value = state.selections.year;
    updateApp();
}
  
// Initialize event handlers
const ui_elements = [
    "year-range"
];

ui_elements.forEach(e => {
    document.getElementById(e).addEventListener('change', () => {
        // Update state
        updateApp();
    })
})

document.getElementById("animate-viz").addEventListener("click", animate);
//document.getElementById("stop-animate-viz").addEventListener("click", exit);


// Load data files
d3.csv("../../Data files/olympic_athlete_events.csv")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        state.years = [...new Set(d3.map(data, d => parseInt(d.Year)))].filter(d => d >= 1924).sort();
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });