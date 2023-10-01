const state = {
    data: []
}

function filterData() {
    // filter the raw data according to user selection
    const updated = aq.from(state.data)
        .filter(d => op.includes(["November", "December"], d.month))
        .objects();
    
    return(updated);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    let adjusted = aq.from(filtered)
        .groupby(['sales_person', 'sales_person_img'])
        .rollup({
            months: d => op.array_agg(d.month), 
            sales: d => op.array_agg(d.sales)
        })
        .objects();
    return(adjusted);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    const dims = {
        height: 800, 
        width: 700
    }
    const margins = {
        top: 25, 
        left: 175, 
        bottom: 50, 
        right: 25
    }

    let svg = d3.select(selector)
        .append("svg")
        .attr("id", `${selector}-svg`)
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    let xScale = d3.scaleLinear()
        .range([0, dims.width]);

    let yScale = d3.scaleBand()
        .range([0, dims.height]);

    let yAxis = d3.axisLeft().scale(yScale);

    let xAxisWithGrid = d3.axisBottom()
        .scale(xScale)
        .tickFormat(x => d3.format("$.2s")(x))
        .tickSizeInner(-dims.height);

    let g_xAxisWithGrid = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + (dims.height + 20) + ')');

    let g_yAxis = svg.append("g").attr("class", "y-axis");

    let bar = svg.append("g").attr("class", "bar");
    let circ1 = svg.append("g").attr("class", "circ-1");
    let circ2 = svg.append("g").attr("class", "circ-2");

    function update(new_data) {
        // updates the specific visualization with the given data
        xScale.domain([
            0,
            d3.max(new_data, d => { return Math.max(d.sales[0],d.sales[1]); }) * 1.05
        ]);
        
        yScale.domain([...new Set(d3.map(new_data, d => d.sales_person))]);

        g_xAxisWithGrid.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(xAxisWithGrid);

        g_yAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(yAxis);

        bar.selectAll("line")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("line")
                        .attr("x1", d => xScale(d.sales[0]))
                        .attr("x2", (d) => xScale(d.sales[1]))
                        .attr("y1", (d) => yScale(d.sales_person) + (yScale.bandwidth() / 2))
                        .attr("y2", (d) => yScale(d.sales_person) + (yScale.bandwidth() / 2))
                        .style("stroke-width", "0.25rem")
                        .style("stroke", "transparent")
                        .transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .style("stroke", "gray");
                }, 
                (update) => update,
                (exit) => exit.remove()
            );

        circ1.selectAll("circle")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("circle")
                        .attr("class", d => d.months[0])
                        .attr("cx", d => xScale(d.sales[0]))
                        .attr("cy", (d) => yScale(d.sales_person) + (yScale.bandwidth() / 2))
                        .transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("r", 10);
                }, 
                (update) => update,
                (exit) => exit.remove()
            );

        circ2.selectAll("circle")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("circle")
                        .attr("class", d => d.months[1])
                        .attr("cx", d => xScale(d.sales[1]))
                        .attr("cy", (d) => yScale(d.sales_person) + (yScale.bandwidth() / 2))
                        .transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("r", 10);
                }, 
                (update) => update,
                (exit) => exit.remove()
            );

            g_yAxis.selectAll(".tick")._groups[0].forEach(el => {
                const index = el.__data__;
                const transf = el.attributes.transform.value;
                const t_vals = transf.replace("translate", "").replace("(", "").replace(")", "").split(",");
                const width = 100;

                g_yAxis.append("image")
                    .attr("transform", `translate(${(-1 * width)-10},${parseFloat(t_vals[1]) - (yScale.bandwidth() / 2)})`)
                    .attr("href", new_data.filter(d => d.sales_person == index)[0].sales_person_img)
                    .attr("width", width)
                    .style("opacity", 0)
                    .transition()
                    .duration(1200)
                    .ease(d3.easeSin)
                    .style("opacity", 1);
            })

        return update;
    }

    // return the update function to be called
    return update;
}

// create a specific instance
const vis = createVis("#chart");

function updateApp() {
    // updates the application
    const filtered = filterData();
    const new_data = wrangleData(filtered);
    console.log(new_data);

    // update visualization
    vis(new_data);
}

d3.csv("../../Data files/office_sales.csv")
    .then((raw) => {
        let parsed = [];
        raw.forEach(r => {
            parsed.push({
                month: r.month, 
                sales_person: r.sales_person, 
                sales_person_img: r.sales_person_img, 
                sales: parseInt(r.sales)
            })
        })
        return parsed;
    })
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });