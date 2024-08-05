const state = {
    data: [
        {name: "Keyonte George", ts_ptile: 0.71}, 
        {name: "Keyonte George", ts_ptile: 0.44}, 
        {name: "Taylor Hendricks", ts_ptile: 0.67}, 
        {name: "Brice Sensabaugh", ts_ptile: 0.35}, 
        {name: "Cody Williams", ts_ptile: 0.8}, 
        {name: "Isaiah Collier", ts_ptile: 0.2}, 
        {name: "Kyle Filipowski", ts_ptile: 0.54}, 
    ]
    // e.g., user selection
}

function getFilters() {
    //state.metric = document.getElementById("fg-perc-radio").checked ? "fg_perc" : "ts_perc";
}

function filterData(data) {
    // filter the raw data according to user selection
    return(data);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    return(filtered);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    getFilters();

    const tbl = d3.select(selector)
        .append("table")
        .attr("class", "table w-25")
        .attr("id", `${selector}-tbl`);

    const thead = tbl.append("thead");
    const tbody = tbl.append("tbody");

    function fill() {
        const cols = ["Name", "True Shooting %tile"]
        
        thead.append("tr")
            .selectAll("td")
            .data(cols)
            .enter()
            .append("th")
            .attr("class", c => c != "Name" ? "text-center" : "")
            .text(c => c);

    }

    function update(new_data) {
        // updates the specific visualization with the given data
        getFilters();

        tbody.selectAll("tr")
            .data(new_data.sort((a,b) => b.ts_ptile - a.ts_ptile))
            .join(
                (enter) => {
                    enter.append("tr")
                        .selectAll("td")
                        .data(d => Object.entries(d))
                        .enter()
                        .append("td")
                        .html(d => {
                            if(d[0] != "ts_ptile") {
                                return d[1];
                            }

                            const orientation = d[1] < (1/2) ? "right" : "left";
                            const color = d[1] < (1/4) ? "q1": d[1] < (2/4) ? "q2" : d[1] < (3/4) ? "q3": "q4";
                            const graph = `
                                <div class="d-flex gap-2">
                                <div class="text-bg-${color}" style="text-align:right;width:${d[1]*75}%">
                                </div>
                                ${d3.format(".0%")(d[1])}
                                </div>
                            `
                            return graph;
                        });
                }, 
                (update) => {
                    update.selectAll("td")
                        .data(d => Object.entries(d))
                        .text(d => d[1])
                },
                (exit) => exit.remove()
            );

        state.first = false; // Control behavior just for first load
        return update;
    }

    // return the update function to be called
    return [fill, update];
}

// create a specific instance
const [fill, update]= createVis("#table");

function updateApp() {
    // updates the application
    getFilters();
    const filtered = filterData(state.data);
    const new_data = wrangleData(filtered);
    console.log(new_data);
    // update visualization    
    update(new_data);
}

document.getElementById("sort-in").addEventListener("change", (e) => {
    state.order = e.target.value;
    updateApp();
});

/*
d3.json("../../Data files/draft-rankings.json")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.tiers = data.tiers;
        state.data = data.rankings;
        
        // Initial fill
        fill();
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });
*/

fill();
update(state.data);
//state.data = aq.table(state.data_pre).objects();