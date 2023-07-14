var sankey = d3.sankey();

d3.csv('../Data files/shot-charts.csv', (data) => { 
    console.log(data);
}