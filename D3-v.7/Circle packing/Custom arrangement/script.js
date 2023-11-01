const dims = {
    width: 500, height: 350, 
    top: 10, left: 10, right: 10, bottom: 10
}

let [red, yellow, green, blue, orange] = ["red", "yellow", "green", "blue", "orange"];

const svg = d3.select("#chart")
    .append("svg")
    .attr("id", "chart-svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .append("g")
    .attr("transform", `translate(${dims.left},${dims.top})`);

const data = [
    {x: 50, y: 50, label: "Sunnyside", points: [
        {size: 5, color: red},
        {size: 7, color: yellow},
        {size: 9, color: green},
        {size: 11, color: blue},
        {size: 4, color: orange},
    ]},
    {x: 150, y: 125, label: "Carlsbad", points: [
        {size: 3, color: red},
        {size: 8, color: yellow},
        {size: 2, color: green},
        {size: 6, color: blue},
    ]},
    {x: 250, y: 200, label: "Camareo", points: [
        {size: 3, color: red},
        {size: 4, color: yellow},
        {size: 5, color: green},
        {size: 1, color: blue},
    ]},
    {x: 350, y: 275, label: "Oceanview", points: [
        {size: 6, color: red},
        {size: 6, color: yellow},
        {size: 3, color: green},
        {size: 4, color: blue},
    ]}
];

svg.append("g")
    .attr("class", "points")
    .selectAll()
    .data(data)
    .join(
        (enter) => {
            enter.append("circle")
                .style("stroke", "gray")
                .style("fill", "white")
                .style("stroke-width", 1)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .transition().duration(750)
                .attr("r", 30);

            enter.append("text")
                .style("text-anchor", "middle")
                .style("font-size", "0.5rem")
                .attr("x", d => d.x)
                .attr("y", d => d.y - 35)
                .style("opacity", 0)
                .text(d => d.label)
                .transition().duration(1000)
                .style("opacity", 1);

            const pack = d3.pack().size([60,60]).padding(2);

            const circle_pack = enter.append("g")
                .attr("id", d => d.label)
                .attr("class", "packed-circle")
                .style("fill-opacity", 0.6)
                .attr("transform", d => `translate(${d.x - 30},${d.y - 30})`)
                .on("mouseover", mouseover)
                .on("mouseleave", mouseleave);
            
            const nodes = circle_pack.selectAll()
                .data(d => pack(d3.hierarchy({children: d.points}).sum(dd => dd.size)).leaves())
                .join("g")
                .attr("transform", dd => `translate(${dd.x},${dd.y})`);

            nodes.append("circle")
                .style("stroke", "gray")
                .style("stroke-width", 0.5)
                .style("fill", dd => dd.data.color)
                .transition().duration(750)
                .attr("r", dd => dd.r);

        }, 
        (update) => update, 
        (exit) => exit.remove()
    )

function mouseover(d) {
    const target = d.target.parentElement.parentElement;
    
    d3.select(target)
        .transition().duration(250)
        .style("fill-opacity", 0.9);

    d3.selectAll(".packed-circle")
        .filter(c => c.label != target.id)
        .transition().duration(250)
        .style("fill-opacity", 0.3);
}

function mouseleave(d) {
    d3.selectAll(".packed-circle")
        .transition().duration(250)
        .style("fill-opacity", 0.6);
}