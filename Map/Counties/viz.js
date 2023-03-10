// Color scale
let colorScale;

function startup() {
    d3.json("https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json", data => {
        // console.log(data);

        // Filtering for counties in Utah
        let county_ids = ['49011', '49029', '49035', "49045", "49049", "49057", "49003", "49043", "49033", "49005", "49051"]

        data = data.features.filter(d => {
            return county_ids.includes(d.id)
            // return d.properties.STATE == "49"
        })

        console.log(data)

        data.forEach(d =>{
            console.log(d.properties.NAME + " | " + d.id)
        })

        // Creating input

        let u_counties = d3.map(data, d => { return d.properties.NAME}).keys();

        d3.select("#controls")
            .append("select")
            .attr("name", "counties")
            .attr("id", "my-county");

        d3.select("#my-county")
            .selectAll("option")
            .data(u_counties)
            .enter()
            .append("option")
            .text(d => { return d });

        colorScale = d3.scaleOrdinal()
            .domain(u_counties)
            .range(
                u_counties.map(c => {
                    if(c == document.getElementById("my-county").value) {
                        return "#ac192d"
                    } else {
                        return "#ebeaeb"
                    }
                })
            );

        let width = 1000
        let height = 700
    
        // Map projection
    
        var path = d3.geoPath();
        var projection = d3.geoAlbers()
            .scale(width*15)
            .center([-16, 41])
            .translate([width / 2, height / 2]);
    
        svg = d3.select("#canvas")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    
        svg.append("g")
            .selectAll("path")
            .data(data)
            .enter()
                .append("path")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .attr("fill", (d) => { return colorScale(d.properties.NAME) })
                .attr("stroke", "#ac192d")
                .attr("stroke-width", 0.5);
        
    })
}

function change(data) {
    svg.select("#")
}

startup();

document.getElementById("#controls").addEventListener("change", function(){ renderViz() });