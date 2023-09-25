// Global variables
const state = {
    data: [], 
    selections: {}
}

const dims = {height: 100, width: 100}
const margins = {left: 10, top: 30, right: 10, bottom: 10}

let xScale;
let yScale;

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
        .classed(classname, false)
        .classed(`${classname}-hovered`, true);
}

function mousemove(d) {

}

function mouseleave(d) {
    let classname = d.target.classList[1];
    let classtrunc = classname.replace('-hovered', '');

    d3.selectAll(`.${classname}`)
        .classed(classname, false)
        .classed(classtrunc, true);
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

    xScale = d3.scaleLinear().range([0, dims.width]);
    yScale = d3.scaleLinear().range([dims.height, 0]);

    let line = d3.line()
        .curve(d3.curveLinearClosed);

    function update(new_data) {
        // Joins data to elements, specifying enter, update, exit logic
        let mywaffle = new waffleChart(new_data, "|");

        let altered = mywaffle.getData();
        const ranges = mywaffle.getRanges();

        xScale.domain(ranges.x);
        yScale.domain(ranges.y);

        const charts = [
            {svg: na_svg, title: "North America"}, 
            {svg: eu_svg, title: "Europe"}, 
            {svg: af_svg, title: "Africa"}
        ]

        charts.forEach(crt => {
            crt.svg.selectAll("path")
                .data(
                    altered.filter(d => { return d.group.includes(crt.title)}), 
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
                            .attr("class", d => { return `poly ${d.detail}` });
                    }, 
                    (update) => {
                        update
                            .attr("class", d => { return `poly ${d.detail}` });
                    }, 
                    (exit) => exit.remove()
                );

            crt.svg.append("text")
                .attr("x", 0)
                .attr("y", margins.top * -1 / 3)
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
  
// Initialize even handlers
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