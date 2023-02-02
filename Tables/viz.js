let columns

d3.csv("../Data files/nba_efficiency.csv", (data) => {

    // Getting the column names

     data.forEach((d) => {
        columns = Object.keys(d)
    });

    let table = d3.select("#my-table")
        .append("table");

    let caption = table.append("caption")
        .text("Top NBA Scorers")

    let thead = table.append("thead");

    let tbody = table.append("tbody");

    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text((c) => { return c });
    
    let rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");
    
    let cells = rows.selectAll("td")
        .data((row) => {
            return columns.map((c) => {
                return {column: c, value: row[c]}
            });
        })
        .enter()
        .append("td")
        .text((d) => { return d.value })

})