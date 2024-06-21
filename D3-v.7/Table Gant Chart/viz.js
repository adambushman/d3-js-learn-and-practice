const state = {
    tiers: [], 
    data: [], 
    metric: "fg_perc", 
    first: true, 
    columns: [], 
    order: "high_rank"
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
    //state.metric = document.getElementById("fg-perc-radio").checked ? "fg_perc" : "ts_perc";
}

function filterData(data) {
    // filter the raw data according to user selection
    return(data);
}

function wrangleData(filtered) {
    // wrangles the given filtered data to the format required by the visualizations
    const tiers = state.tiers.map(t => {
        return {value: t}
    });

    const names = filtered.map(f => {
        return {name: f.name}
    });

    const prepped = aq.from(tiers)
        .cross(aq.from(names))
        .join_left(
            aq.from(filtered)
                .fold(['low', 'mid', 'high'])
        )
        .filter(d => d.name != undefined)
        .derive({tier_rank: aq.escape(d => d.key != undefined ? state.columns.indexOf(d.value) : undefined)})
        .groupby('name')
        .derive({
            low_rank: d => op.min(d.tier_rank), 
            mid_rank: d => op.median(d.tier_rank), 
            high_rank: d => op.max(d.tier_rank)
        })
        .groupby(['name', 'low_rank', 'mid_rank', 'high_rank'])
        .pivot('value', 'key')
        .ungroup()
        .derive({sort_column: aq.escape(d => d[state.order])})
        .orderby(aq.desc('sort_column'), 'name')
        .select(aq.not('low_rank', 'mid_rank', 'high_rank'))
        .objects();

    return(prepped);
}

function createVis(selector) {
    // initialized for creating the visualizations, e.g., setup SVG, init scales, ...
    getFilters();

    let tbl = d3.select(selector)
        .append("table")
        .attr("class", "table")
        .attr("id", `${selector}-tbl`);

    function fill() {
        state.columns = ["Name"].concat(state.tiers);
        
        tbl.append("thead")
            .append("tr")
            .selectAll("td")
            .data(state.columns)
            .enter()
            .append("th")
            .attr("class", c => c != "Name" ? "text-center" : "")
            .text(c => c);

    }

    function update(new_data) {
        // updates the specific visualization with the given data
        getFilters();

        // First load behavior
        if(state.first) {

        }

        function sort_entries(e) {
            const cols = state.columns;
            let fill = false;

            const e_sorted = [...Object.entries(e)]
                .sort((a,b) => cols.indexOf(a[0]) - cols.indexOf(b[0]))
                .map((e,i) => {
                    if(e[1] == "low") {
                        fill = true;
                        e[2] = fill;
                    } else if (e[1] == "high") {
                        e[2] = fill;
                        fill = false;
                    } else {
                        e[2] = fill;
                    }

                    return e;
                });

            return e_sorted;
        }

        new_data.unshift(new_data[0]); // Fixes missing first entry; don't know why
        console.log(new_data);
        tbl.selectAll("tr")
            .data(new_data)
            .join(
                (enter) => {
                    enter.append("tr")
                        .selectAll("td")
                        .data(d => sort_entries(d))
                        .enter()
                        .append("td")
                        .style("width", d => d[0] == "name" ? "12%" : "8%")
                        .style("position", d => {
                            return d[0] == "name" ? "sticky" : "normal";
                        })
                        .append("div")
                        .attr("class", d => {
                            const classes = ["d-flex"];

                            d[0] != "name" ? classes.push("justify-content-center") : "";
                            d[1] == "low" ? classes.push("rounded-start-pill") : d[1] == "high" ? classes.push("rounded-end-pill") : classes.push("");

                            return classes.join(" ");
                        })
                        .style("background-color", d => {
                            return d[2] ? "hsl(220, 65%, 33%, 90%)" : "white";
                        })
                        .style("font-size", d => {
                            return d[0] == "name" ? "1.25rem" : "1rem";
                        })
                        .style("font-weight", d => {
                            return d[0] == "name" ? "bold" : "normal";
                        })
                        .html(d => {
                            if(d[0] == "name") {
                                return d[1];
                            } else if(d[1] == undefined) {
                                return "&nbsp;";
                            } else {
                                if(d[1] == "mid") {
                                    return `<i class="bi bi-circle-fill text-white"></i>`;
                                } else if (d[1] == "high") {
                                    return `<i class="bi bi-caret-up-fill text-white"></i>`;
                                } else {
                                    return `<i class="bi bi-caret-down-fill text-white"></i>`;
                                }
                            }
                        });
                }, 
                (update) => {
                    update.selectAll("td")
                        .data(d => sort_entries(d))
                        .style("width", d => d[0] == "name" ? "12%" : "8%")
                        .select("div")
                        .attr("class", d => {
                            const classes = ["d-flex"];

                            d[0] != "name" ? classes.push("justify-content-center") : "";
                            d[1] == "low" ? classes.push("rounded-start-pill") : d[1] == "high" ? classes.push("rounded-end-pill") : classes.push("");

                            return classes.join(" ");
                        })
                        .style("background-color", d => {
                            return d[2] ? "hsl(220, 65%, 33%, 90%)" : "white";
                        })
                        .style("font-size", d => {
                            return d[0] == "name" ? "1.25rem" : "1rem";
                        })
                        .style("font-weight", d => {
                            return d[0] == "name" ? "bold" : "normal";
                        })
                        .html(d => {
                            if(d[0] == "name") {
                                return d[1];
                            }  else if(d[1] == "mid") {
                                return `<i class="bi bi-circle-fill text-white"></i>`;
                            } else if (d[1] == "high") {
                                return `<i class="bi bi-caret-up-fill text-white"></i>`;
                            } else if (d[1] == "low"){
                                return `<i class="bi bi-caret-down-fill text-white"></i>`;
                            } else {
                                return "&nbsp;";
                            }
                        });
                },
                (exit) => exit.remove()
            );

        state.first = false; // Control behavior just for first load
        return update;
    }

    // return the update function to be called
    return [fill, update];
}

// create a specific instance
const [fill, update]= createVis("#table");

function updateApp() {
    // updates the application
    getFilters();
    const filtered = filterData(state.data);
    const new_data = wrangleData(filtered);
    console.log(new_data);
    // update visualization    
    update(new_data);
}

document.getElementById("sort-in").addEventListener("change", (e) => {
    state.order = e.target.value;
    updateApp();
});

d3.json("../../Data files/draft-rankings.json")
    .then((data) => {
        // load data, e.g., via d3.json and update app afterwards
        state.tiers = data.tiers;
        state.data = data.rankings;
        
        // Initial fill
        fill();
        updateApp();
    })
    .catch((error) => {
        console.error(error);
    });