const state = {
    data: []
}

const dims = {height: 100, width: 100}
const margins = {left: 10, top: 10, right: 10, bottom: 10}

let xScale;
let yScale;

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

        let altered = aq.from(transformed)
            .derive({instances: aq.escape(d => Array(parseInt(parseFloat(d.value) * 100)).fill(0)) })
            .unroll('instances')
            .groupby('group')
            .derive({
                index: d => op.row_number() - 1,
            })
            .derive({
                x: aq.escape(d => ((d.index % 10) * 5) + 2), 
                x2: aq.escape(d => ((d.index % 10) * 5) + 6), 
                y: aq.escape(d => (Math.floor(d.index / 10) * 5) + 2), 
                y2: aq.escape(d => (Math.floor(d.index / 10) * 5) + 6 )
            })
            .derive({ coords: d => [[d.x, d.y],[d.x2, d.y],[d.x2, d.y2],[d.x, d.y2]] })
            .select(['group','detail','value','coords'])
            .objects();

        console.log(altered);

        xScale = d3.scaleLinear().domain([2,51]).range([0, dims.width]);
        yScale = d3.scaleLinear().domain([2,51]).range([dims.height, 0]);

        let line = d3.line()
            .curve(d3.curveLinearClosed);
        
        svg.selectAll("path")
            .data(altered.filter(d => { return d.group == '2010|North America'}))
            .enter()
            .append("path")
            .attr("class", d => { return `poly ${d.detail}` })
            .attr("d", d => {
                return line(d.coords);
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
            
    })
    .catch((error) => {
        console.error(error);
    });