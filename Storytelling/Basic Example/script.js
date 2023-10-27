const data = [
    {x: 1, y: 12, z: 7, a: 1},
    {x: 2, y: 10, z: 9, a: 2},
    {x: 3, y: 5, z: 8, a: 4},
    {x: 4, y: 4, z: 5, a: 5},
    {x: 5, y: 2, z: 6, a: 10},
    {x: 6, y: 1, z: 4, a: 12},
];

let chosen;

const dims1 = {width: 500, height: 300};
const dims2 = {width: 500, height: 500};
const margins = {top: 10, bottom: 10, left: 10, right: 10, padding: 10};

const svg1 = d3.select("#chart-1")
    .append("svg")
    .attr("viewBox", `
    0 0 ${dims1.width + margins.left + margins.right} ${dims1.height + margins.top + margins.bottom}
    `)
    .append("g")
    .attr("transform", `translate(${margins.left},${margins.top})`);

const svg2 = d3.select("#chart-2")
    .append("svg")
    .attr("viewBox", `
    0 0 ${dims2.width + margins.left + margins.right} ${dims2.height + margins.top + margins.bottom}
    `)
    .append("g")
    .attr("transform", `translate(${margins.left + (dims2.width / 2)},${margins.top + (dims2.height / 2)})`);

const xScale = d3.scaleBand()
    .domain([...new Set(d3.map(data, d => d.x))])
    .range([0, dims1.width]);

const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.y)])
    .range([0, dims1.height]);

const updateChart1 = (data) => {
    svg1.selectAll("rect")
    .data(data)
    .join(
        (enter) => {
            enter.append("rect")
                .attr("width", xScale.bandwidth() - 25)
                .attr("x", d => xScale(d.x) + 25)
                //.transition().duration(1000)
                .attr("y", d => dims1.height - yScale(d[chosen]))
                .attr("height", d => yScale(d[chosen]))
        }, 
        (update) => {
            update.transition().duration(1000)
                .attr("y", d => dims1.height - yScale(d[chosen]))
                .attr("height", d => yScale(d[chosen]));
        }, 
        (exit) => exit.remove()
    )
}

let pie = d3.pie()
    .value(d => d.val);

const radius = (dims2.width / 2) - 10;

const color = d3.scaleOrdinal()
    .domain([...new Set(d3.map(data, d => d.x))])
    .range(["#537c78", "#7ba591", "#cc222b", "#f15b4c", "#faa41b", "#ffd45b"]);

const updateChart2 = (data) => {
    const transformed = [];
    data.forEach(d => {
        transformed.push({id: d.x, val: d[chosen]});
    });

    svg2.selectAll(".slice")
    .data(pie(transformed))
    .join(
        (enter) => {
            enter.append("path")
                .attr("class", ".slice")
                .style("fill", d => color(d.data.id))
                .transition().duration(500).delay((d,i) => i * 250)
                .attr("d", d3.arc()
                    .innerRadius(radius / 2)
                    .outerRadius(radius)
                )

        }, 
        (update) => {
            update.transition().duration(500)
                .attr("d", d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                );
        }, 
        (exit) => exit.remove()
    )
}

const tileObserver = new IntersectionObserver(entries => {
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
            updateChart1(data);
        }

        // Chart 1, Transition 2
        if(entry.target.id == "c1-t2" & intersecting) {
            chosen = "z";
            updateChart1(data);
        }

        // Chart 1, Transition 3
        if(entry.target.id == "c1-t3" & intersecting) {
            chosen = "a";
            updateChart1(data);
        }

        // Chart 2, Transition 1
        if(entry.target.id == "c2-t1" & intersecting) {
            chosen = "a";
            updateChart2(data);
        }

        // Chart 2, Transition 2
        if(entry.target.id == "c2-t2" & intersecting) {
            chosen = "z";
            updateChart2(data);
        }
    });
}, 
{
    threshold: 0.5
}
);

const stickyObserver = new IntersectionObserver(entries => {
    console.log(entries);
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            sticky.forEach(s => {
                if(s != entry.target) {
                    d3.select(s).transition().duration(1500).style("opacity", 0);
                }
            });
        } else {
            const prevIndx = [...sticky].indexOf(entry.target);
            d3.select(sticky[prevIndx - 1]).transition().duration(1500).style("opacity", 1);
        }
    });
}, 
{
    threshold: 0.25
});

const tiles = document.querySelectorAll(".story-tile");
tiles.forEach(t => {
    d3.select(t).style("opacity", 0);
    tileObserver.observe(t);
});

const sticky = document.querySelectorAll(".sticky-top");
sticky.forEach(s => {
    stickyObserver.observe(s);
});