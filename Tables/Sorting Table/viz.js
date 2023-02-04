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
            .text((c) => { return c });

        createTableBody("id");

        function createTableBody(sortKey) {
            
            // Switch the sorting for every click

            if (sortInfo.order.toString() == d3.ascending.toString()) { 
                sortInfo.order = d3.descending; 
            }
            else { 
                sortInfo.order = d3.ascending; 
            }
            
            // Sorting the data

            data.sort((x,y) => {
                return sortInfo.order(x[sortKey], y[sortKey])
            });
            
            // Displaying the data 

            tbody.selectAll("tr")
                .data(data)
                .enter()
                .append("tr")
                .selectAll("td")
                .data((d) => { return d3.entries(d) })
                .enter()
                .append("td")
                .text((d) => { return d.value });

            // Implementing the sorting

            tbody.selectAll("tr")
                .data(data)
                .selectAll("td")
                .data((d) => { return d3.entries(d) })
                .text((d)=> { return d.value });

        };

});