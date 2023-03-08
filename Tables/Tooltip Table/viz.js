let columns;

// Defining the sorting 

var sortInfo = { key: "sales", order: d3.descending };

d3.csv("../../Data files/office_sales.csv",

    // Casting values

    (d) => {
        return { 
            month : d.month, 
            sales_person : d.sales_person, 
            sales: parseInt(d.sales) 
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
            .text((d) => { 
                if(d.key == "sales") {
                    return d3.format("$,.0f")(d.value)
                }
                else {
                    return d.value 
                }
            });

});