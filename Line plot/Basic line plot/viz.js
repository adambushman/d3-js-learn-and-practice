// Setting dimensions

let s = 500;

let margin = {top: s * 0.2, right: s * 0.05, bottom: s * 0.12, left: s * 0.17};
let width = (s * 1.5) - margin.left - margin.right;
let height = s - margin.top - margin.bottom;

// Defining the titles and labels

let title = "Daily Site Visits Trend";
let subtitle = "Fake, Randomly Generated Site Visit Data"
let ylab = "Daily Site Visits"

// Defining the scales

let xScale
let yScale

// Drawing plotting area

let svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#279AF1")
    .style("border-radius", "10px")
    .append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// Loading the data

d3.csv('../../Data files/site_visits.csv', 
    
    // Formatting the dates
    (d) => {
        return { date : d3.timeParse("%m/%d/%Y")(d.date), site_visits: parseInt(d.site_visits) }
    }, 
    
    // Plotting the data
    (data) => {

        console.log(data)
        
        // Defining the axes

        xScale = d3.scaleTime()
            .domain(d3.extent(data, (d) => { return d.date}))
            .range([ 0, width ]);

        yScale = d3.scaleLinear()
            .domain([
                d3.min(data, (d) => { return d.site_visits }), 
                d3.max(data, (d) => { return d.site_visits })
            ])
            .range([ height, 0 ]);

        // Plotting the axes

        svg.append("g")
            .attr("transform", "translate(0, " + height + ")")
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Plotting the data

        svg.append("path")
            .datum(data)
            .style("fill", "none")
            .style("stroke", "#F7F7FF")
            .style("stroke-width", 1.5)
            .attr("d", d3.line()
                .x((d) => { return xScale(d.date) })
                .y((d) => { return yScale(d.site_visits) })
            );

        // Adding the titles and labels
        
        svg.append("text")
            .attr("x", (width / 2) - (margin.left / 2))
            .attr("y", margin.top / -2)
            .style("font-size", 30)
            .style("font-weight", 600)
            .style("text-anchor", "middle")
            .style("fill", "#F7F7FF")
            .text(title);

        svg.append("text")
            .attr("x", (width / 2) - (margin.left / 2))
            .attr("y", margin.top / -4)
            .style("font-size", 16)
            .style("text-anchor", "middle")
            .text(subtitle);

        svg.append("text")
            .attr("x", (margin.left / -2))
            .attr("y", height / 2)
            .attr('transform', 'rotate(-90, ' + (margin.left  * 2 / -3) + ', ' + (height / 2) + ')')
            .style("font-size", 16)
            .style("font-weight", 600)
            .style("text-anchor", "middle")
            .text(ylab);

    }
    
)