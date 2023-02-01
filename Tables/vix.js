

d3.csv("../Data files/nba_efficiency.csv", (data) => {

    console.log(data)

    let table = d3.select("my-table")
        .insert("table", ":first-child")
        .attr("id", "NameList");

    let thead = table.append("thead");

    let tbody = table.append("tbody");

    thead.append("tr")
        .selectAll("th")
        .data(d3.entries)

})