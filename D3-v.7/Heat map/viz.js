const state = {
    data: [], 
    metric: "poss", 
    value: 100
}

const ww = window.innerWidth;

const playerLast = (name) => {
    const name_split = name.split(" ");

    return name_split[1];
}

let xScale, yScale, dims, margins;

const wrapText = (
    text,
    width,
    dyAdjust = 0.5,
    lineHeightEms = 1.3,
    lineHeightSquishFactor = 1,
    splitOnSlash = true,
    centreVertically = true
) => {
    text.each(function () {
      var text = d3.select(this),
        x = text.attr("x"),
        y = text.attr("y");
      var words = [];
      text
        .text()
        .split(/\s+/)
        .forEach(function (w) {
          if (splitOnSlash) {
            var subWords = w.split("/");
            for (var i = 0; i < subWords.length - 1; i++)
              words.push(subWords[i] + "/");
            words.push(subWords[subWords.length - 1] + " ");
          } else {
            words.push(w + " ");
          }
        });
  
      text.text(null); // Empty the text element
  
      // `tspan` is the tspan element that is currently being added to
      var tspan = text.append("tspan");
  
      var line = ""; // The current value of the line
      var prevLine = ""; // The value of the line before the last word (or sub-word) was added
      var nWordsInLine = 0; // Number of words in the line
      for (var i = 0; i < words.length; i++) {
        var word = words[i];
        prevLine = line;
        line = line + word;
        ++nWordsInLine;
        tspan.text(line.trim());
        if (tspan.node().getComputedTextLength() > width && nWordsInLine > 1) {
          // The tspan is too long, and it contains more than one word.
          // Remove the last word and add it to a new tspan.
          tspan.text(prevLine.trim());
          prevLine = "";
          line = word;
          nWordsInLine = 1;
          tspan = text.append("tspan").text(word.trim());
        }
      }
  
      var tspans = text.selectAll("tspan");
  
      var h = lineHeightEms;
      // Reduce the line height a bit if there are more than 2 lines.
      if (tspans.size() > 2)
        for (var i = 0; i < tspans.size(); i++) h *= lineHeightSquishFactor;
  
      tspans.each(function (d, i) {
        // Calculate the y offset (dy) for each tspan so that the vertical centre
        // of the tspans roughly aligns with the text element's y position.
        var dy = i * h + dyAdjust;
        if (centreVertically) dy -= ((tspans.size() - 1) * h) / 2;
        d3.select(this)
          .attr("y", y)
          .attr("x", x)
          .attr("dy", dy + "em");
      });
    });
}

const alterPosition = (x,y) => {
    const svgsize = document.getElementById("chart-svg").getBoundingClientRect();
    const [sX, sY] = [
        svgsize.width / (dims.width + margins.left + margins.right), 
        svgsize.height / (dims.height + margins.top + margins.bottom)
    ];
    const [newX, newY] = [
        (parseFloat(x) + margins.left) * sX, 
        (parseFloat(y) + margins.top) * sY
    ];
    return [newX, newY];
}

function showhide(d) {
    const rects = d3.selectAll("rect");
    const active = this.className.baseVal.includes("clicked");

    if(tt.classed("visually-hidden")) tt.classed("visually-hidden", false);

    if(active) {
        rects.transition().duration(250)
            .style("fill-opacity", 1).style("stroke", "none").style("stroke-width", 0);
        this.classList.toggle("clicked");
        tt.classed("visually-hidden", true);
    } else {
        rects.transition().duration(250)
            .style("fill-opacity", 0.25).style("stroke", "none").style("stroke-width", 0);
        d3.select(this).transition().duration(250)
            .style("fill-opacity", 1).style("stroke", "black").style("stroke-width", 2);
        
        d3.select(".clicked").classed("clicked", false);
        this.classList.toggle("clicked");
 
        // Tooltip content
        const data = d.target.__data__;
        tt.selectAll("text").remove();
        tt.append("text")
            .html(`
                <h5 class="tt-h">${data.player1} | ${data.player2}</h5>
                <table class="table">
                    <tr><th>Minutes</th><td>${d3.format(",")(data.mins)}</td></tr>
                    <tr><th>Possessions</th><td>${d3.format(",")(data.poss)}</td></tr>
                    <tr><th>Point diff per 100 poss</th><td>${d3.format("+.3s")(data.pm)}</td></tr>
                </table>
            `);

        // Tooltip position
        const thisrect = d3.select(this);
        const [x,y] = alterPosition(thisrect.attr("x"), thisrect.attr("y"));
        const tt_size = document.getElementById("tooltip").getBoundingClientRect();
        const [ny, nx] = [y - tt_size.height - 20, x  + 25 - (tt_size.width / 2)];
        
        console.log(ww - tt_size.width + nx, ww)

        tt.style("top", `${ny}px`).style("left", `${nx < 0 ? 20 : (tt_size.width + nx) > ww ? ww - tt_size.width - 20 : nx}px`);
    }
}

const getFilters = () => {
    state.metric = document.getElementById("metricIn").value;
    state.value = document.getElementById("valueIn").value;
}

function filterData() {
    // filter the raw data according to user selection
    const filtered = aq.from(state.data)
        .filter(aq.escape(d => d[state.metric] > state.value))
        .objects();
    return(filtered);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    return(filtered);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    dims = {
        height: 800, 
        width: 800
    }
    margins = {
        top: 125, 
        left: 150, 
        bottom: 150, 
        right: 25
    }

    const bounder = d3.select(`#${selector}`)
        .append("svg")
        .attr("id", `${selector}-svg`)
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `);

    const defs = bounder.append("defs");
    const grad = defs.append("linearGradient")
        .attr("id", "myLinearGradient")
        .attr("x1", "0").attr("x2", "1")
        .attr("y1", "0").attr("y2", "0");

    grad.append("stop").attr("offset", 0).style("stop-color", "#050505").style("stop-opacity", 1);
    grad.append("stop").attr("offset", 0.5).style("stop-color", "#dbe2ea").style("stop-opacity", 1);
    grad.append("stop").attr("offset", 1).style("stop-color", "#f6ee26").style("stop-opacity", 1);

    let svg = bounder.append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);


    const legend = svg.append("g").attr("class", "legend").style("opacity", 0)
        .attr("transform", `translate(${(margins.left / -2) + (margins.left)},${dims.height + (margins.bottom / 2)})`);

    legend.append("text").attr("x", dims.width / 3).attr("y", -12)
        .style("text-anchor", "middle").style("font-size", "1.3rem")
        .text(`Point differential per 100 possessions`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", dims.width * 2 / 3)
        .attr("height", 35)
        .style("fill", "url(#myLinearGradient)");

    const legendtext = legend.append("g").attr("class", "legend-text");

    let colorScale = d3.scaleLinear()
        .range(["#050505", "#dbe2ea", "#f6ee26"]);

    xScale = d3.scaleBand()
        .range([0, dims.width]);

    yScale = d3.scaleBand()
        .range([0, dims.height]);

    let g_xAxisWithGrid = svg.append("g")
        .attr("class", "x-axis");

    let g_yAxisWithGrid = svg.append("g").attr("class", "y-axis");

    let squares = svg.append("g").attr("class", "squares");

    function update(new_data) {
        // updates the specific visualization with the given data
        xScale.domain([...new Set(d3.map(new_data, d => playerLast(d.player1)))].sort());
        const full_names = [...new Set(d3.map(new_data, d => d.player2))];
        yScale.domain(full_names.sort((a,b) => a.substring(a.search(" ") + 1) > b.substring(b.search(" ") + 1) ? 1 : -1));
        
        colorScale.domain([
            d3.min(new_data, d => d.pm),  
            0,  
            d3.max(new_data, d => d.pm)
        ]);

        let yAxisWithGrid = d3.axisLeft()
            .scale(yScale);
        let xAxisWithGrid = d3.axisTop()
            .scale(xScale);

        g_xAxisWithGrid.call(xAxisWithGrid);
        g_xAxisWithGrid.selectAll(".tick text").attr("x", 0).style("fill", "transparent").call(wrapText, 50)
            .transition().duration(1200).ease(d3.easeSin).style("fill", "black");

        g_yAxisWithGrid.call(yAxisWithGrid);
        g_yAxisWithGrid.selectAll(".tick text").style("fill", "transparent").call(wrapText, 50)
            .transition().duration(1200).ease(d3.easeSin).style("fill", "black");
    
        g_xAxisWithGrid.selectAll(".tick text")
            .style("text-anchor", "end")
            .attr("transform", "translate(0,-10) rotate(45)")

        svg.selectAll(".tick text")
            .style("font-size", "1.3rem");

        legendtext.selectAll("text")
            .data(colorScale.domain())
            .join(
                (enter) => {
                    enter.append("text")
                        .attr("x", (d,i) => 250 * (i))
                        .attr("y", 60)
                        .text(d => d3.format("+.2s")(d));
                }, 
                (update) => update.text(d => d3.format("+.2s")(d)), 
                (exit) => exit.remove()
            );

        legend.transition().duration(1200).style("opacity", 1);

        squares.selectAll("rect")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("rect")
                    .on("click", showhide)
                    .style("fill", d => isNaN(d.pm) | d.player1 == d.player2 ? "white" : colorScale(d.pm))
                    .attr("x", d => isNaN(d.pm) | d.player1 == d.player2 ? null : xScale(playerLast(d.player1)) + xScale.bandwidth() / 2)
                    .attr("y", (d) => isNaN(d.pm) | d.player1 == d.player2 ? null : yScale(d.player2) + yScale.bandwidth() / 2)
                    .transition()
                    .duration(1200)
                    .ease(d3.easeSin)
                    .attr("x", d => isNaN(d.pm) | d.player1 == d.player2 ? null : xScale(playerLast(d.player1)))
                    .attr("y", (d) => isNaN(d.pm) | d.player1 == d.player2 ? null : yScale(d.player2))
                    .attr("width", d => isNaN(d.pm) | d.player1 == d.player2 ? null : xScale.bandwidth())
                    .attr("height", d => isNaN(d.pm) | d.player1 == d.player2 ? null : yScale.bandwidth());
                }, 
                (update) => {
                    update
                    .style("fill", d => isNaN(d.pm) | d.player1 == d.player2 ? "white" : colorScale(d.pm))
                    .attr("x", d => isNaN(d.pm) | d.player1 == d.player2 ? null : xScale(playerLast(d.player1)) + xScale.bandwidth() / 2)
                    .attr("y", (d) => isNaN(d.pm) | d.player1 == d.player2 ? null : yScale(d.player2) + yScale.bandwidth() / 2)
                    .attr("width", d => isNaN(d.pm) | d.player1 == d.player2 ? null : 0)
                    .attr("height", d => isNaN(d.pm) | d.player1 == d.player2 ? null : 0)
                    .transition()
                    .duration(1200)
                    .ease(d3.easeSin)
                    .attr("x", d => isNaN(d.pm) | d.player1 == d.player2 ? null : xScale(playerLast(d.player1)))
                    .attr("y", (d) => isNaN(d.pm) | d.player1 == d.player2 ? null : yScale(d.player2))
                    .attr("width", d => isNaN(d.pm) | d.player1 == d.player2 ? null : xScale.bandwidth())
                    .attr("height", d => isNaN(d.pm) | d.player1 == d.player2 ? null : yScale.bandwidth());
                },
                (exit) => exit.remove()
            );
    }

    // return the update function to be called
    return update;
}

// create a specific instance
const vis = createVis("chart");

function updateApp() {
    getFilters();

    // updates the application
    const filtered = filterData();
    const new_data = wrangleData(filtered);
    console.log(new_data);

    // update visualization
    vis(new_data);
}

d3.csv("../../Data files/utah-jazz-lineups-24.csv")
    .then((raw) => {
        let parsed = [];
        raw.forEach(r => {
            parsed.push({
                player1: r.player1, 
                player2: r.player2, 
                mins: parseInt(r.mins), 
                poss: parseInt(r.poss), 
                pm: parseFloat(r.pm)
            })
        })
        return parsed;
    })
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });

const tt = d3.select("#chart").append("div")
    .attr("id", "tooltip")
    .attr("class", "visually-hidden rounded")
    .style("padding", "0.25rem 0.4rem")
    .style("position", "absolute")
    .style("top", "0px")
    .style("left", "0px")
    .style("background-color", "white")
    .style("border", "solid 1px black");

["metricIn", "valueIn"].forEach(el => {
    document.getElementById(el).addEventListener("change", event => {
        updateApp();
    })
})