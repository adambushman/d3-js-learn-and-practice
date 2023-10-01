const state = {
    data: [], 
    metric: "fg_perc"
    // e.g., user selection
}

const wrapText = (
    text,
    width,
    dyAdjust = 0.5,
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

function getFilters() {
    state.metric = document.getElementById("fg-perc-radio").checked ? "fg_perc" : "ts_perc";
}

function filterData(data) {
    // filter the raw data according to user selection
    return(data);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    let adjusted = aq.from(filtered)
        .orderby('athlete_display_name')
        .objects();
    return(adjusted);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    const dims = {
        height: 800, 
        width: 700
    }
    const margins = {
        top: 25, 
        left:125, 
        bottom: 25, 
        right: 25
    }

    getFilters();
    let svg = d3.select(selector)
        .append("svg")
        .attr("id", `${selector}-svg`)
        .attr("viewBox", `
            0 0 ${dims.width + margins.left + margins.right} ${dims.height + margins.top + margins.bottom}
        `)
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    let xScale = d3.scaleLinear()
        .range([0, dims.width]);

    let yScale = d3.scaleBand()
        .range([0, dims.height]);

    let xAxis = d3.axisBottom().scale(xScale).ticks(5).tickFormat(x => d3.format(".0%")(x));
    let yAxis = d3.axisLeft().scale(yScale);

    let g_xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr('transform', 'translate(0, ' + dims.height + ')');

    let g_yAxis = svg.append("g").attr("class", "y-axis");

    function update(new_data) {
        // updates the specific visualization with the given data
        getFilters();

        xScale.domain([
            d3.min(new_data, d => { return d[state.metric]; }) * 0.95,
            d3.max(new_data, d => { return d[state.metric]; }) * 1.05
        ]);

        yScale.domain(d3.map(new_data, d => { return d.athlete_display_name; }));

        g_xAxis.transition()
            .duration(1200)
            .ease(d3.easeSin)
            .call(xAxis);

        g_yAxis.call(yAxis);

        g_yAxis.selectAll(".tick text").style("fill", "transparent").call(wrapText, 50)
            .transition().duration(1200).ease(d3.easeSin).style("fill", "white");

        svg.selectAll("rect")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("rect")
                        .attr("x", 0)
                        .attr("y", (d) => yScale(d.athlete_display_name) + yScale.bandwidth() * 0.15)
                        .attr("height",  yScale.bandwidth() * 0.7)
                        .style("fill", "#684756")
                        .transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("width", (d) => xScale(d[state.metric]));
                }, 
                (update) => {
                    update.transition()
                        .duration(1200)
                        .ease(d3.easeSin)
                        .attr("width", (d) => xScale(d[state.metric]));
                },
                (exit) => exit.remove()
            );

        return update;
    }

    // return the update function to be called
    return update;
}

// create a specific instance
const vis = createVis("#chart");

function updateApp() {
    // updates the application
    getFilters();
    const filtered = filterData(state.data);
    const new_data = wrangleData(filtered);

    // update visualization
    vis(new_data);
}

// init interaction, e.g., listen to click events
["fg-perc-radio", "ts-perc-radio"].forEach(e => {
    d3.select(`#${e}`).on('click', () => {
        // update state
        updateApp();
    })
})

d3.csv("../../Data files/fg_ts_example.csv")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.data = data;
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });