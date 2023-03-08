let columns;

d3.csv("../../Data files/nba_efficiency.csv",

    // Casting values

    (d) => {
        return { 
            PLAYER: d.PLAYER,
            TEAM: d.TEAM, 
            MIN: parseInt(d.MIN), 
            PTS: parseInt(d.PTS), 
            TSA: parseInt(d.TSA), 
        }
    }, 

    // Loading the data

    (data) => {
        
        // Testing successful data load
        console.log(data)

        // Additional data
        let data_plus = [];
        data.forEach((d) => {
            data_plus.push({
                PLAYER: d.PLAYER, 
                PTS36: Math.round(parseInt(d.PTS) * 36 / parseInt(d.MIN)), 
                TSA36: Math.round(parseInt(d.TSA) * 36 / parseInt(d.MIN))
            })
        });

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

        // ToolTip Functions

        function getAdded(id, metric) {
            data_plus.forEach((d) => {
                if(id == d.PLAYER) {
                    let t = d[metric + "36"];
                    let test = genTT(t);
                    return test;
                }
            })
        }

        function genTT(val) {
            return `<span class="ToolTip">${val} per 36</span>`
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
                if(["PTS", "TSA"].includes(d.key)) {
                    return "TT"
                }
            })
            //.text((d) => { return d.value })
            .html((d) => {
                if(d.key == "PLAYER") {
                    my_player = d.value;
                }
                if(["PTS", "TSA"].includes(d.key)) {
                    // CAN'T FIGURE THIS ONE OUT
                    // Issue is the function is returning NaN
                    console.log(getAdded(my_player, d.key))
                    return d.value + getAdded(my_player, d.key)
                }
                else {
                    return d.value 
                }
                
            });
});