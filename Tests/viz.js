let width = 700;
let height = 500;
let padding = 20;

// Drawing the Canvas
let svg = d3.select('#canvas-1')
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

d3.select("#toggle-1")
    .on("click", () => {
        [ds1, ds2] = [ds2, ds1];

        svg.selectAll("line").data(ds1)
            .transition().duration(1000)
            .ease(d3.easeSin)
            .delay((d,i) => 100 * i)
            .attr("y2", d => scY(d));
    });


// Drawing new canvas
let svg2 = d3.select('#canvas-2')
    .append('svg')
    .attr('width', 500 + (padding * 2))
    .attr('height', 500 + (padding * 2))
    .append("g")
    .attr("transform", `translate(${padding}, ${padding})`);

let a = 3.2, b = 5.9;
let phi, omega = 2 * Math.PI / 10000;

let crrX = 150+100, crrY = 150+0;
let prvX = crrX, prvY = crrY;

let timer = d3.timer(t => {
    phi = omega * t;

    crrX = 150+100*Math.cos(a*phi);
    crrY = 150+100*Math.sin(b*phi);

    svg2.selectAll("line")
        .each(function() { this.bogus_opacity *= 0.99})
        .attr("stroke-opacity", function() { return this.bogus_opacity })
        .filter(function() { return this.bogus_opacity < 0.05})
        .remove();

    svg2.append("line")
        .each(function() { this.bogus_opacity = 1.0 })
        .attr("x1", prvX)
        .attr("y1", prvY)
        .attr("x2", crrX)
        .attr("y2", crrY)
        .attr("stroke", "green")
        .attr("stroke-width", 2);

    prvX = crrX;
    prvY = crrY;

    if(t > 120e3) { timer.stop() }
})


// Drawing new canvas
let svg3 = d3.select('#canvas-3')
    .append('svg')
    .attr('width', 300 + (padding * 2))
    .attr('height', 300 + (padding * 2))
    .append("g")
    .attr("transform", `translate(${padding}, ${padding})`);

let n = 50, w = 300 / n, dt = 3000;

let data = d3.range(n*n)
    .map(d => { return {x: d%n, y: d/n|0, val: Math.random() }});

let sc = d3.scaleQuantize()
    .range(["white", "red", "black"]);

svg3.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => w * d.x)
    .attr("y", d => w * d.y)
    .attr("width", w-1)
    .attr("height", w-1)
    .attr("fill", d => sc(d.val));

function update() {
    let nbs = [
        [0,1], [0,-1], [1,0], [-1,0], 
        [1,1], [1,-1], [-1,1], [-1,-1]
    ];

    return d3.shuffle(d3.range(n*n)).map(i => {
        let nb = nbs[nbs.length * Math.random() | 0];
        let x = (data[i].x + nb[0] + n)%n;
        let y = (data[i].y + nb[1] + n)%n;

        data[i].val = data[y*n + x].val;
    })
}

d3.interval(function() {
    update();
    svg3.selectAll("rect").data(data)
        .transition()
        .duration(dt)
        .delay((d,i) => i * 0.25 * dt / (n*n))
        .attr("fill", d => sc(d.val))
}, dt);
