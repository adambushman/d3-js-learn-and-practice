const state = {
    data: []
}

const dims = {
    h: 311.68, 
    w: 500, 
    m: 50
}

const svg_wrapper = d3.select("#tile-map")
    .append("svg")
    .attr("id", "svg-viz")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("viewBox", `0 0 ${dims.w + dims.m} ${dims.h + dims.m}`);

const svg_defs = svg_wrapper.append("defs");

const hex = Array(6).fill({}).map((d,i) => {
    const rn = ((2 * i / 6) + (1 / 6)) * Math.PI;
    const r = 25;

    return [
        r * Math.cos(rn), 
        r * Math.sin(rn)
    ]
});

const hex_path = d3.line().curve(d3.curveLinearClosed)(hex)

svg_defs.append("clipPath")
    .attr("id", "hexagonClip")
    .append("path")
    .attr("d", hex_path);
    
const svg = svg_wrapper.append('g')
    .attr("transform", `translate(${dims.m / 2}, ${dims.m / 2})`);

let xScale;
let yScale;

const populateViz = () => {
    xScale = d3.scaleLinear()
        .domain(d3.extent(state.data, d => d.x))
        .range([0, dims.w]);

    yScale = d3.scaleLinear()
        .domain(d3.extent(state.data, d => d.y))
        .range([dims.h, 0]);

    const g = svg.selectAll("g")
        .data(state.data)
        .enter()
        .append("g")
        .attr("class", "state-hex")
        .attr("transform", d => `translate(
            ${xScale(d.x)},
            ${yScale(d.y)}
        )`)
        .attr("clip-path", "url(#hexagonClip)");

    g.append("image")
        .attr("transform", d => `translate(-45, -45)`)
        .attr("xlink:href", d => d.image ? d.image : "https://www.announcementconverters.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/S/-/S-ILG11F_10.JPG")
        .attr("width", 90)
        .attr("height", 90);

    g.append("rect")
        .attr("transform", "translate(-30,0) rotate(30)")
        .attr("width", 50)
        .attr("height", 10)
        .attr("fill", "white");

    g.append("text")
        .attr("transform", "translate(-9,17) rotate(30)")
        .attr("font-size", 4)
        .attr("text-anchor", "middle")
        .text(d => d.full_name);
}

d3.csv("../../Data files/us-tile-layout.csv")
    .then(layout => {
        d3.json("../../Data files/travel-log.json")
            .then(log => {
                state.data = layout.map(d => {
                    const log_v = log.filter(l => l.abbrev == d.abbrev);

                    d.x = parseFloat(d.x);
                    d.y = parseFloat(d.y);
                    d.image = log_v.length > 0 ? log_v[0].image : undefined;

                    return d;
                })
    
                populateViz();
            })
    })
    .catch((error) => {
        console.error(error);
    });;