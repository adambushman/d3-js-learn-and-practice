const parameters = {
    width: 800, height: 400
}

const svg = d3.select("#gradient")
    .append("svg")
    .attr("viewBox", `0 0 800 400`);

svg.append("defs");

const rect = svg.append("rect")
    .attr("x", 200)
    .attr("y", 0)
    .attr("width", 400)
    .attr("height", 400)
    .attr("fill", "url(#currGradient)");

const updateSVG = () => {
    svg.select("defs").remove();
    const defs = svg.append("defs");

    if(parameters.type == 'radialGradient') {
        rect.attr("rx", "100%");
    }

    const gradient = defs.append(parameters.type)
        .attr("id", "currGradient")
        .attr("x1", parameters.x1)
        .attr("x2", parameters.x2)
        .attr("y1", parameters.y1)
        .attr("y2", parameters.y2);

    parameters.locs.forEach((l,i) => {
        gradient.append("stop")
            .attr("offset", l)
            .style("stop-color", parameters.colors[i])
            .style("stop-opacity", 1);
    });



    gradient.append("stop")
        .attr("offset", 1)
        .style("stop-color", "orange")
        .style("stop-opacity", 1);
}

const snagParameters = () => {
    parameters.width = parseInt(document.getElementById("widthIn").value);
    parameters.height = parseInt(document.getElementById("heightIn").value);
    parameters.x1 = parseFloat(document.getElementById("x1In").value);
    parameters.x2 = parseFloat(document.getElementById("x2In").value);
    parameters.y1 = parseFloat(document.getElementById("y1In").value);
    parameters.y2 = parseFloat(document.getElementById("y2In").value);
    
    const type = document.getElementById("typeIn").options;
    parameters.type = type[type.selectedIndex].value;

    const colors = document.getElementById("colorsIn").value;
    parameters.colors = colors.split(",");

    const locs = document.getElementById("locsIn").value;
    parameters.locs = (locs.split(",")).map(l => parseFloat(l));
}

snagParameters();
updateSVG();

["widthIn", "heightIn", "x1In", "x2In", "y1In", "y2In", "typeIn", "colorsIn", "locsIn"].forEach(el => {
    document.getElementById(el).addEventListener("change", () => {
        snagParameters();
        updateSVG();
    });
});