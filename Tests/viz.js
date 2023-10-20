let width = 700;
let height = 500;
let padding = 20;

// Drawing the Canvas
let svg = d3.select('#canvas')
    .append('svg')
    .attr('width', width + (padding * 2))
    .attr('height', height + (padding * 2))
    .append("g")
    .attr("transform", `translate(${padding}, ${padding})`);


let ds1 = [2, 1, 3, 5, 7, 8, 9, 9, 9, 8, 7, 5, 3, 1, 2]
let ds2 = [8, 9, 8, 7, 5, 3, 2, 1, 2, 3, 5, 7, 8, 9, 8]

const mx = d3.max(d3.merge([ds1,ds2]));

const scX = d3.scaleLinear()
    .domain([0, ds1.length - 1]).range([0, width]);

const scY = d3.scaleLinear()
    .domain([0, mx]).range([height, 0]);

svg.selectAll("line")
    .data(ds1)
    .enter()
    .append("line")
    .attr("stroke", "red")
    .attr("stroke-width", 20)
    .attr("x1", (d,i) => scX(i))
    .attr("y1", scY(0))
    .attr("x2", (d,i) => scX(i))
    .attr("y2", (d,i) => scY(d));

d3.select("#toggle-change")
    .on("click", () => {
        [ds1, ds2] = [ds2, ds1];

        svg.selectAll("line").data(ds1)
            .transition().duration(1000)
            .ease(d3.easeSin)
            .delay((d,i) => 100 * i)
            .attr("y2", d => scY(d));
    })