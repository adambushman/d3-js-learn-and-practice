// Global variables
const state = {
    data: [], 
    selections: {}
}

const dims = {height: 100, width: 100}
const margins = {left: 10, top: 30, right: 10, bottom: 10}

let xScale;
let yScale;
let colorScale;

const createSVG = (element, svg_id) => {
    return d3.select(element)
        .append("svg")
        .attr("id", svg_id)
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);
}

function rescale(array) {
    let new_array = [];
    array.forEach(a => {
        new_array.push([
            xScale(a[0]), yScale(a[1])
        ])
    })
    return new_array;
}

function mouseover(d) {
    let classname = d.target.classList[1];

    d3.selectAll(`.${classname}`)
        .transition().duration(500)
        .style("opacity", 1);

    d3.selectAll(".title-rect")
        .transition().duration(500)
        .style("fill", colorScale(classname));
    
    d3.selectAll(`.${classname}-title-text`)
        .transition().duration(500)
        .style("fill", "var(--prim-dark)");
}

function mousemove(d) {

}

function mouseleave(d) {
    let classname = d.target.classList[1];

    d3.selectAll(`.${classname}`)
        .transition().duration(500)
        .style("opacity", 0.8);

    d3.selectAll(".title-rect")
        .transition().duration(500)
        .style("fill", "transparent");
    
    d3.selectAll(`.${classname}-title-text`)
        .transition().duration(500)
        .style("fill", "transparent");
}

const populateSelections = () => {
    state.selections = {
        year: d3.select("#year-select")._groups[0][0].value
    }
}

// Filter the raw data according to user selection
function filterData() {
    return state.data.filter(d => d.year === state.selections.year);
}

// Wrangle data based on structure
function wrangleData(filtered) {
    let transformed = aq.from(filtered)
        .derive({
            group: d => d.year + '|' + d.region,
            detail: d => d.travel, 
            value: d => d.share
        })
        .select(['group', 'detail', 'value'])
        .objects();

    return transformed;
}

// Visualization logic
function createVis() {
    // Setup vis structure: SVG, scales, etc.
    let na_svg = createSVG("#chart-1", "svg-north-america");
    let eu_svg = createSVG("#chart-2", "svg-europe");
    let af_svg = createSVG("#chart-3", "svg-africa");

    const charts = [
        {svg: na_svg, title: "North America"}, 
        {svg: eu_svg, title: "Europe"}, 
        {svg: af_svg, title: "Africa"}
    ];

    charts.forEach(d => {
        d.svg.append("g").attr("class", "tiles");
        d.svg.append("rect").attr("class", "title-rect default");
        d.svg.append("text").attr("class", "title");
        d.svg.append("g").attr("class", "labels");
    });

    xScale = d3.scaleLinear().range([0, dims.width]);
    yScale = d3.scaleLinear().range([dims.height, 0]);
    colorScale = d3.scaleOrdinal().range([
        "#3ABA51", "#D81159", "#0496FF", "#FFBC42"
    ]);

    let line = d3.line()
        .curve(d3.curveLinearClosed);

    function update(new_data) {
        // Joins data to elements, specifying enter, update, exit logic
        let mywaffle = new waffleChart(new_data, "|");
        let altered = mywaffle.getData();
        const ranges = mywaffle.getRanges();

        xScale.domain(ranges.x);
        yScale.domain(ranges.y);
        colorScale.domain([...new Set(d3.map(new_data, d => d.detail))]);

        console.log(altered);

        charts.forEach(crt => {
            let alt_filt = aq.from(altered)
                .filter(aq.escape(d => d.group.includes(crt.title)))
                .objects()

            crt.svg.select("g .tiles")
                .selectAll("path")
                .data(
                    alt_filt, 
                    d => d.id
                )
                .join(
                    (enter) => {
                        enter.append("path")
                            .attr("d", d => {
                                return line(rescale(d.coords));
                            })
                            .on("mouseover", mouseover)
                            .on("mousemove", mousemove)
                            .on("mouseleave", mouseleave)
                            .attr("class", d => { return `poly ${d.detail}` })
                            .style("fill", d => colorScale(d.detail))
                            .style("opacity", 0.8);
                    }, 
                    (update) => {
                        update//.style("fill", d => colorScale(d.detail));
                    }, 
                    (exit) => exit.remove()
                );

            let group_filt = aq.from(alt_filt)
                .groupby(["group", "detail"])
                .rollup({ perc: d => op.mean(d.value)})
                .objects();

            crt.svg.select("rect")
                .attr("x", 0)
                .attr("y", margins.top * -4 / 7)
                .attr("height", 13)
                .attr("width", 80)
                .text(crt.title)
                .attr("rx", 3);

            crt.svg.select("g .labels")
                .selectAll("text")
                .data(
                    group_filt, 
                    d => d.id
                )
                .join(
                    (enter) => {
                        enter
                            .append("text")
                            .attr("class", d => `perc ${d.detail}-title-text`)
                            .attr("x", 4)
                            .attr("y", margins.top * -1 / 4)
                            .text(d => `${d.detail}: ${d3.format(".0%")(d.perc)}`)
                            .style("font-size", "0.5rem")
                            .style("font-weight", "bold")
                            .style("fill", "transparent");
                    }, 
                    (update) => {
                        update
                            .text(d => `${d.detail}: ${d3.format(".0%")(d.perc)}`);
                    }, 
                    (exit) => exit.remove()
                );

            crt.svg.select(".title")
                .attr("x", 0)
                .attr("y", margins.top * -5 / 7)
                .text(crt.title)
                .style("font-size", "0.7rem")
                .style("fill", "var(--prim-light)");
        })
    }

    // Return the update function to be called later
    return update;
}
  
// Create an instance of the visualization
const vis = createVis();

// Update the application based on new data via event handlers
function updateApp() {
    // Generate new data from updated parameters
    populateSelections();
    const filtered = filterData();
    const new_data = wrangleData(filtered);

    // Update visualization
    vis(new_data);
}
  
// Initialize event handlers by id
["year-select"].forEach(e => {
    d3.select(`#${e}`).on('change', () => {
        // update state
        updateApp();
    })
})


// Load data files
d3.csv('../../Data files/travel.csv')
    .then((data) => {
        state.data = data;
        populateSelections();
        const filtered = filterData();
        const new_data = wrangleData(filtered);

        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });