let columns;

d3.csv("../../Data files/nba_efficiency.csv",

    // Casting values

    (d) => {
        return { 
            PLAYER: d.PLAYER,
            TEAM: d.TEAM, 
            MIN: parseInt(d.PTS) , 
            PTS: parseInt(d.PTS) , 
            TSA: parseInt(d.TSA) 
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

        // Creating the table

        let table = d3.select("#my-table")
            .append("table");
        
        // Creating a title and subtitle

        table.append("caption")
            .attr("class", "table-title")
            .text("Sales of the Office");

        table.append("caption")
            .attr("class", "table-subtitle")
            .text("From \'The Office\' Season 7 Episode 13")

        // ToolTip Function

        function genTT(val, min) {
            let scaled = Math.round(val * 36 / min, 1)
            return `${scaled} per 36`
        }
        
        // Setting up the table head and body
        
        let thead = table.append("thead");

        let tbody = table.append("tbody");

        // Creating the columns

        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
            .on("click", (c) => { createTableBody(c) }) // Sorting function
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
            .attr("class", (d) => {
                if(d.key == "PTS") {
                    return "TT"
                }
            })
            //.text((d) => { return d.value })
            .html((d) => {
                if(d.key == "PTS") {
                    return d.value + "<span class='ToolTip'>" + d.value + "</span>"
                }
                else {
                    return d.value 
                }
                
            });
            // Append spans here

});