let columns

function renderTable(table_name) {
    d3.csv("../../Data files/nba_efficiency.csv", (data) => {

        // Getting the column names
    
         data.forEach((d) => {
            columns = Object.keys(d)
        });
    
        // Creating the table
    
        let table = d3.select(table_name)
            .append("table");
    
        // Setting up the table head and body
    
        let thead = table.append("thead");
    
        let tbody = table.append("tbody");
    
        // Adding the column headers
    
        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
            .text((c) => { return c });
    
        tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr")
            .selectAll("td")
            .data((d) => { return d3.entries(d) })
            .enter()
            .append("td")
            .text((d) => { return d.value });
            
    })
}

renderTable("#my-table-1")
renderTable("#my-table-2")
renderTable("#my-table-3")
renderTable("#my-table-4")