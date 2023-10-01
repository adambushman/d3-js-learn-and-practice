// Global variables
const state = {
    data: [], 
    selections: {
        metric: "fta", 
        perspective: "team"
    }, 
    dims: {height: 1500, width: 1000}, 
    margins: {left: 125, bottom: 75, top: 75, right: 25}
}

const wrapText = (
    text,
    width,
    dyAdjust = 0.25,
    lineHeightEms = 1.5,
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

// Function to pull selections from UI
function pullSelections() {
    state.selections.metric = document.getElementById("metric-select").value;
    state.selections.perspective = document.getElementById("perspective-select").value;
}

// Filter the raw data according to user selection
function filterData() {
    return state.data;
}

// Wrangle data based on structure
function wrangleData(filtered) {
    return filtered;
}

// Visualization logic
function createVis() {
    // Setup vis structure: SVG, scales, etc.

    const dims = state.dims;
    const margins = state.margins;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("id", "chart-svg")
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    const xScale = d3.scaleLinear()
        .range([0, dims.width]);

    const yScale = d3.scaleBand()
        .range([dims.height, 0]);

    const xAxis1 = d3.axisTop()
        .scale(xScale);

    const xAxis2 = d3.axisBottom()
        .scale(xScale);
        
    const yAxis = d3.axisLeft()
        .scale(yScale);

    let g_xAxis1 = svg.append("g")
        .attr("class", "x-axis");

    let g_xAxis2 = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + dims.height + ')');

    let g_yAxis = svg.append("g")
        .attr("class", "y-axis");

    const whisker = svg.append("g").attr("class", "whiskers");
    const box = svg.append("g").attr("class", "boxes");
    const circles = svg.append("g").attr("class", "circles");

    function update(new_data) {
        const datapoint = `${state.selections.perspective}_${state.selections.metric}`;
        
        // Prepare summary data
        const summ_data = aq.from(new_data)
        .derive({my_metric: aq.escape(d => d[datapoint])})
        .groupby('team')
        .rollup({
            q1: d => op.quantile(d.my_metric, 0.25),
            med: d => op.median(d.my_metric),  
            q3: d => op.quantile(d.my_metric, 0.75), 
        })
        .derive({
            lb: d => d.q1 - ((d.q3 - d.q1) * 1.5), 
            ub: d => d.q3 + ((d.q3 - d.q1) * 1.5)
        })
        .objects()
        
        // Joins data to elements, specifying enter, update, exit logic
        xScale.domain([
            Math.min(
                d3.min(summ_data, d => d.lb), 
                d3.min(new_data, d => d[datapoint])
            ) * 0.9, 
            Math.max(
                d3.max(summ_data, d => d.ub), 
                d3.max(new_data, d => d[datapoint])
            )
        ])

        yScale.domain([...new Set(d3.map(new_data, d => d.team))].sort().reverse());

        g_xAxis1.style("font-size", "0.9rem").transition().duration(1500).call(xAxis1);
        g_xAxis2.style("font-size", "0.9rem").transition().duration(1500).call(xAxis2);
        g_yAxis.style("font-size", "0.9rem").call(yAxis);
        g_yAxis.selectAll(".tick text")
            .style("fill", "transparent").call(wrapText, 85).transition().duration(1500).style("fill", "black");

        const line_width = "0.1";
        const line_col = "#17408b";

        whisker.selectAll("line")
            .data(summ_data)
            .join(
                (enter) => {
                    enter.append("line")
                        .attr("class", "whisker")
                        .attr("x1", d => 0)
                        .attr("y1", d => yScale(d.team) + (yScale.bandwidth() / 2))
                        .attr("y2", d => yScale(d.team) + (yScale.bandwidth() / 2))
                        .style("stroke-width", `${line_width}rem`)
                        .transition()
                        .duration(1500)
                        .style("stroke", line_col)
                        .attr("x1", d => xScale(d.lb))
                        .attr("x2", d => xScale(d.ub));
                }, 
                (update) => {
                    update
                        .transition()
                        .duration(1500)
                        .attr("x1", d => xScale(d.lb))
                        .attr("x2", d => xScale(d.ub))
                        .attr("y1", d => yScale(d.team) + (yScale.bandwidth() / 2))
                        .attr("y2", d => yScale(d.team) + (yScale.bandwidth() / 2));
                }, 
                (exit) => exit.remove()
            );

        const boxadj = 16;

        box.selectAll("rect")
            .data(summ_data)
            .join(
                (enter) => {
                    enter
                        .append("rect")
                        .attr("class", "box")
                        .attr("x", d => 0)
                        .attr("y", d => yScale(d.team) + (boxadj / 2))
                        .attr("height", yScale.bandwidth() - boxadj)
                        .style("fill", "#ffffff")
                        .style("stroke-width", `${line_width}rem`)
                        .transition()
                        .duration(1500)
                        .attr("x", d => xScale(d.q1))
                        .attr("width", d => xScale(d.q3) - xScale(d.q1))
                        .style("stroke", line_col);
                }, 
                (update) => {
                    update
                        .transition()
                        .duration(1500)
                        .attr("x", d => xScale(d.q1))
                        .attr("y", d => yScale(d.team) + (boxadj / 2))
                        .attr("height", yScale.bandwidth() - boxadj);
                }, 
                (exit) => exit.remove()
            );

        box.selectAll("line")
            .data(summ_data)
            .join(
                (enter) => {
                    enter
                        .append("line")
                        .attr("class", "median")
                        .attr("y1", d => yScale(d.team) + (boxadj / 2))
                        .attr("y2", d => yScale(d.team) + (yScale.bandwidth() / 2) + boxadj)
                        .style("stroke-width", `${line_width * 2}rem`)
                        .transition()
                        .duration(1500)
                        .attr("x1", d => xScale(d.med))
                        .attr("x2", d => xScale(d.med))
                        .style("stroke", line_col);
                }, 
                (update) => {
                    update 
                        .transition()
                        .duration(1500)
                        .attr("x1", d => xScale(d.med))
                        .attr("x2", d => xScale(d.med))
                        .attr("y1", d => yScale(d.team) + (boxadj / 2))
                        .attr("y2", d => yScale(d.team) + (yScale.bandwidth() / 2) + (boxadj * 3 / 2));
                }
            )

        const jitter_val = 10;

        circles.selectAll("circle")
            .data(new_data)
            .join(
                (enter) => {
                    enter
                        .append("circle")
                        .attr("class", "circle")
                        .style("fill", "#c9082a")
                        .style("fill-opacity", 0.35)
                        .attr("cy", d => {
                            const jitter = Math.floor(Math.random() * (jitter_val + 1)) - (jitter_val / 2);
                            return yScale(d.team) + (yScale.bandwidth() / 2) + jitter;
                        })
                        .transition()
                        .duration(1500)
                        .attr("cx", d => {
                            const jitter = Math.floor(Math.random() * (jitter_val + 1)) - (jitter_val / 2);
                            return xScale(d[datapoint]) + jitter;
                        })

                        .attr("r", 5);
                }, 
                (update) => {
                    update
                        .transition()
                        .duration(1500)
                        .attr("cx", d => {
                            const jitter = Math.floor(Math.random() * (jitter_val + 1)) - (jitter_val / 2);
                            return xScale(d[datapoint]) + jitter;
                        })
                        .attr("cy", d => {
                            const jitter = Math.floor(Math.random() * (jitter_val + 1)) - (jitter_val / 2);
                            return yScale(d.team) + (yScale.bandwidth() / 2) + jitter;
                        });
                }, 
                (exit) => exit.remove()
            );
    }

    // Return the update function to be called later
    return update;
}
  
// Create an instance of the visualization
const vis = createVis();

// Update the application based on new data via event handlers
function updateApp() {
    pullSelections();

    // Generate new data from updated parameters
    const filtered = filterData();
    const new_data = wrangleData(filtered);

    // Update visualization
    vis(new_data);
}
  
// Initialize even handlers
const ui_elements = [
    "metric-select", 
    "perspective-select"
];

ui_elements.forEach(e => {
    document.getElementById(e).addEventListener('change', () => {
        // Update state
        updateApp();
    })
})


// Load data files
d3.csv("../../Data files/team-box-shots.csv")
    .then((raw) => {
        let cleaned = [];

        raw.forEach(r => {
            cleaned.push({
                team: r.team, 
                team_fta: parseInt(r.team_fta), 
                team_ftp: parseFloat(r.team_ftp), 
                opponent_fta: parseInt(r.opponent_fta), 
                opponent_ftp: parseFloat(r.opponent_ftp) 
            })
        })
        return cleaned;
    })
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        console.log(data);
        pullSelections();
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });