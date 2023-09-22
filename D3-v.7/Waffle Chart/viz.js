const state = {
    data: []
}

const dims = {height: 100, width: 100}
const margins = {left: 10, top: 10, right: 10, bottom: 10}

let xScale;
let yScale;

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

let svg = d3.select("#chart")
    .append("svg")
    .attr("id", "svg-chart")
    .attr("viewBox", `
        0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
    `)
    .append("g")
    .attr("transform", `translate(${margins.left},${margins.top})`);

d3.csv('../../Data files/travel.csv')
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;

        let transformed = aq.from(state.data)
            .derive({
                group: d => d.year + '|' + d.region,
                detail: d => d.travel, 
                value: d => d.share
            })
            .select(['group', 'detail', 'value'])
            .objects();

        console.log(transformed);

        let mywaffle = new waffleChart(transformed, "|");

        let altered = mywaffle.getData();
        const ranges = mywaffle.getRanges();

        console.log(altered);

        xScale = d3.scaleLinear().domain(ranges.x).range([0, dims.width]);
        yScale = d3.scaleLinear().domain(ranges.y).range([dims.height, 0]);

        let line = d3.line()
            .curve(d3.curveLinearClosed);
        
        svg.selectAll("path")
            .data(altered.filter(d => { return d.group == '1930|Africa'}))
            .enter()
            .append("path")
            .attr("class", d => { return `poly ${d.detail}` })
            .attr("d", d => {
                return line(rescale(d.coords));
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
            
    })
    .catch((error) => {
        console.error(error);
    });