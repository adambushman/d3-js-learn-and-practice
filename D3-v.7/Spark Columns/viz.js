const state = {
    data: [], 
    category: "Auto Gas", 
    months: 12, 
    budget: 200, 
    first: true
    // e.g., user selection
}

const months = [
    {n: 1, name: "January", abb: "Jan"}, 
    {n: 2, name: "February", abb: "Feb"}, 
    {n: 3, name: "March", abb: "Mar"}, 
    {n: 4, name: "April", abb: "Apr"}, 
    {n: 5, name: "May", abb: "May"}, 
    {n: 6, name: "June", abb: "Jun"}, 
    {n: 7, name: "July", abb: "Jul"}, 
    {n: 8, name: "August", abb: "Aug"}, 
    {n: 9, name: "September", abb: "Sep"}, 
    {n: 10, name: "October", abb: "Oct"},
    {n: 11, name: "November", abb: "Nov"},
    {n: 12, name: "December", abb: "Dec"}
];

function getFilters() {
    state.months = document.getElementById("mo12-radio").checked ? 12 : 3;
}

function wrangleData(data) {
    // wrangles the given filtered data to the format required by the visualizations
    const today = new Date();
    const maxyr = today.getFullYear();
    const maxmon = today.getMonth();

    const timeperiod = aq.table({year: [maxyr, maxyr-1]})
        .cross(aq.from(months));

    let adjusted = timeperiod
        .join_left(
            aq.from(data)
                .filter(aq.escape(d => d.category == state.category)),
            [["year", "name"],["year", "month"]]
        )
        .filter(aq.escape(d => d.n <= maxmon || d.year < maxyr))
        .derive({total: d => d.total == undefined ? 0 : d.total})
        .orderby([aq.desc("year"), aq.desc("n")])
        .slice(0, state.months)
        .select(["year", "abb", "total"])
        .objects()
        .reverse();

    console.log(adjusted);
    return(adjusted);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    const dims = {
        height: 300, 
        width: 1000
    }
    const margins = {
        top: 75, 
        left:25, 
        bottom: 50, 
        right: 525
    }

    getFilters();
    let svg = d3.select(selector)
        .append("svg")
        .attr("id", `${selector}-svg`)
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    let yScale = d3.scaleLinear()
        .range([dims.height, 0]);

    let xScale = d3.scaleBand()
        .range([0, dims.width]);

    let xAxis = d3.axisBottom().scale(xScale);

    let g_xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + dims.height + ')');

    const marks = svg.append("g").attr("class", "marks");
    const text = svg.append("g").attr("class", "text");

    text.append("text")
        .attr("x", 0)
        .attr("y", (margins.top) / - 2)
        .style("font-size", "3rem")
        .style("font-weight", "bold")
        .text(state.category);

    const padding = 12;
    ["Average", "Budget", "Total"].forEach((t,i) => {
        text.append("text")
            .attr("x",  (margins.right * 2 / 3) + dims.width + padding)
            .attr("y", (dims.height + margins.top + margins.bottom) * (i+1) / 4)
            .style("font-size", "2.5rem")
            .text(t);
    });

    const avg_label = text.append("text")
        .attr("x",  (margins.right * 2 / 3) + dims.width - padding)
        .attr("y", (dims.height + margins.top + margins.bottom) / 4)
        .style("fill", "#C1666B")
        .style("font-size", "5rem")
        .style("font-weight", "bold")
        .style("text-anchor", "end");

    const budg_label = text.append("text")
        .attr("x", (margins.right * 2 / 3) + dims.width - padding)
        .attr("y", (dims.height + margins.top + margins.bottom) / 2)
        .style("fill", "#48A9A6")
        .style("font-size", "5rem")
        .style("font-weight", "bold")
        .style("text-anchor", "end");

    const total_label = text.append("text")
    .attr("x",  (margins.right * 2 / 3) + dims.width - padding)
    .attr("y", (dims.height + margins.top + margins.bottom) * 3 / 4)
        .style("font-size", "5rem")
        .style("font-weight", "bold")
        .style("text-anchor", "end");

    function update(new_data) {
        // updates the specific visualization with the given data
        getFilters();

        const avg = d3.mean(new_data, d => d.total);
        const total = d3.sum(new_data, d => d.total);

        avg_label.text(d3.format("$,")(avg.toFixed(0)));
        budg_label.text(d3.format("$,")(state.budget.toFixed(0)));
        total_label.text(d3.format("$,")(total.toFixed(0)));

        yScale.domain([
            0, d3.max(new_data, d => { return d.total; })
        ]);

        xScale.domain(d3.map(new_data, d => d.abb));

        g_xAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(xAxis);

        g_xAxis.selectAll("text").attr("font-size", "1.75rem");

        const barwidth = 0.2;

        marks.selectAll("rect")
            .data(new_data, d => d.abb)
            .join(
                (enter) => {
                    enter.append("rect")
                        .attr("x", (d) => xScale(d.abb) + xScale.bandwidth() * (barwidth / 2))
                        .attr("y", dims.height)
                        .attr("height", 0)
                        .attr("width",  xScale.bandwidth() * (1 - barwidth))
                        .style("fill", "#C1666B")
                        .transition()
                        .duration(800)
                        .ease(d3.easeSin)
                        .delay((d,i) => 150*i)
                        .attr("y", d => yScale(d.total))
                        .attr("height", (d) => dims.height - yScale(d.total));
                }, 
                (update) => {
                    update.transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("x", (d) => xScale(d.abb) + xScale.bandwidth() * (barwidth / 2))
                        .attr("width",  xScale.bandwidth() * (1 - barwidth))
                        .attr("y", d => yScale(d.total))
                        .attr("height", (d) => dims.height - yScale(d.total));
                },
                (exit) => exit.remove()
            );

        marks.selectAll("line")
            .data([avg])
            .join(
                (enter) => {
                    enter.append("line")
                        .style("stroke", "#48A9A6")
                        .style("stroke-width", 5)
                        .attr("x1", 0)
                        .attr("y2", d => yScale(d))
                        .attr("y1", d => yScale(d))
                        .transition()
                        .duration(2100)
                        .ease(d3.easeSin)
                        .attr("x2", dims.width);
                }, 
                (update) => {
                    update.transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("y1", d => yScale(d))
                        .attr("y2", d => yScale(d));
                }, 
                (exit) => exit.remove()               
            );

        state.first = false; // Control behavior just for first load
        return update;
    }

    // return the update function to be called
    return update;
}

// create a specific instance
const vis = createVis("#chart");

function updateApp() {
    // updates the application
    getFilters();
    const new_data = wrangleData(state.data);

    // update visualization
    vis(new_data);
}

// init interaction, e.g., listen to click events
["mo12-radio", "mo3-radio"].forEach(e => {
    d3.select(`#${e}`).on('click', () => {
        // update state
        updateApp();
    })
})

d3.json("../../Data files/budget_summary.json")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });