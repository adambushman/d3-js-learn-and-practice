let columns;

d3.csv("../../Data files/nba_efficiency.csv",

    // Casting values

    (d) => {
        return { 
            PLAYER: d.PLAYER,
            TEAM: d.TEAM, 
            MIN: parseFloat(d.MIN), 
            PTS: parseFloat(d.PTS), 
            TSA: parseFloat(d.TSA), 
            PTS36: Math.round(10 *parseFloat(d.PTS) * 36 / parseFloat(d.MIN)) / 10, 
            TSA36: Math.round(10 * parseFloat(d.TSA) * 36 / parseFloat(d.MIN)) / 10
        }
    }, 

    // Loading the data

    (data) => {
        
        // Testing successful data load
        console.log(data)

        // Getting the column names

        data.forEach((d) => {
            columns = Object.keys(d)
        });

        let cols_remove = ["PTS36", "TSA36"];

        columns = columns.filter(v => !cols_remove.includes(v));

        // Creating the table

        let table = d3.select("#my-table")
            .append("table");
        
        // Creating a title and subtitle

        table.append("caption")
            .attr("class", "table-title")
            .text("NBA Top Scorers");

        table.append("caption")
            .attr("class", "table-subtitle")
            .text("2023 Season | Sourced from NBA.com")

        // ToolTip Functions

        var Tooltip = d3.select("#my-table")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("color", "white")
            .style("background-color", "#C8102E")
            .style("border-radius", "5px")
            .style("padding", "5px 10px");

        function mouseover(d) {
            Tooltip
                .transition()
                .duration(250)
                .style("opacity", 1);

            d3.select(this)
                .transition()
                .duration(250)
                .style("background-color", "#C8102E")
                .style("color", "#FFFFFF");
        }

        function mousemove(d) {
            let my_x = this.offsetLeft;
            let my_y = this.offsetTop;

            // console.log(d);

            Tooltip
                .html(`<h4 class='tt'>${d.PTS}</h4>`)
                .style("left", (my_x+90) + "px")
                .style("top", (my_y-75) + "px")
                .style("position", "absolute");
        }

        function mouseleave(d) {
            Tooltip
                .transition()
                .duration(250)
                .style("opacity", 0);
            
            d3.select(this)
                .transition()
                .duration(250)
                .style("background-color", "#FFFFFF")
                .style("color", "#000000");
        }
        
        // Setting up the table head and body
        
        let thead = table.append("thead");

        let tbody = table.append("tbody");

        let my_player;

        // Creating the columns

        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
            .html((c) => { return c });

        // Displaying the data 

        tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr")
            .selectAll("td")
            .data((d) => { return d3.entries(d) })
            .enter()
            .append("td")
            .text((d) => { 
                if(columns.includes(d.key)) {
                    return d.value
                }
             })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
});