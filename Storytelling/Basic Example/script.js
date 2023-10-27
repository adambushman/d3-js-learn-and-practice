const data = [
    {x: 1, y: 12, z: 7},
    {x: 2, y: 10, z: 9},
    {x: 3, y: 5, z: 11},
    {x: 4, y: 4, z: 5},
    {x: 5, y: 2, z: 2},
    {x: 6, y: 1, z: 4},
];

let chosen;

const dims = {width: 500, height: 300};
const margins = {top: 10, bottom: 10, left: 10, right: 10, padding: 10};

const svg = d3.select("#chart-1")
    .append("svg")
    .attr("viewBox", `
    0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
    `)
    .append("g")
    .attr("transform", `translate(${margins.left},${margins.top})`);

const xScale = d3.scaleBand()
    .domain([...new Set(d3.map(data, d => d.x))])
    .range([0, dims.width]);

const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.y)])
    .range([0, dims.height]);

const updateChart = (data) => {
    svg.selectAll("rect")
    .data(data)
    .join(
        (enter) => {
            enter.append("rect")
                .attr("width", xScale.bandwidth() - 25)
                .attr("x", d => xScale(d.x) + 25)
                //.transition().duration(1000)
                .attr("y", d => dims.height - yScale(d[chosen]))
                .attr("height", d => yScale(d[chosen]))
        }, 
        (update) => {
            update.transition().duration(1000)
                .attr("y", d => dims.height - yScale(d[chosen]))
                .attr("height", d => yScale(d[chosen]));
        }, 
        (exit) => exit.remove()
    )
}

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const intersecting = entry.isIntersecting;
        const sel = d3.select(entry.target);

        if(intersecting) {
            sel.transition().duration(1500)
                .style("opacity", 1);
        } else {
            sel.transition().duration(500)
                .style("opacity", 0);
        }

        // Chart 1, Transition 1
        if(entry.target.id == "c1-t1" & intersecting) {
            chosen = "y";
            updateChart(data);
        }

        // Chart 1, Transition 2
        if(entry.target.id == "c1-t2" & intersecting) {
            chosen = "z";
            updateChart(data);
        }
    });
}, 
{
    threshold: 0.5
}
);

const tiles = document.querySelectorAll(".story-tile");
tiles.forEach(t => {
    d3.select(t).style("opacity", 0);
    observer.observe(t);
})