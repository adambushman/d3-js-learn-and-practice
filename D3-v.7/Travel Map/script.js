const state = {
    data: []
}

const dims = {
    h: 300,  
    w: 540, 
    m: 50
}

const wrapText = (
    text,
    width,
    dyAdjust = -0.15,
    lineHeightEms = 1.05,
    lineHeightSquishFactor = 1,
    splitOnSlash = true,
    centreVertically = false
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

const svg_wrapper = d3.select("#tile-map")
    .append("svg")
    .attr("id", "svg-viz")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("viewBox", `0 0 ${dims.w + dims.m} ${dims.h + (dims.m * 2)}`);

const svg_defs = svg_wrapper.append("defs");

const hex = Array(6).fill({}).map((d,i) => {
    const rn = ((2 * i / 6) + (1 / 6)) * Math.PI;
    const r = 23;

    return [
        r * Math.cos(rn), 
        r * Math.sin(rn)
    ]
});

const hex_path = d3.line().curve(d3.curveLinearClosed)(hex)

svg_defs.append("clipPath")
    .attr("id", "hexagonClip")
    .append("path")
    .attr("d", hex_path);

const svg = svg_wrapper.append('g')
    .attr("transform", `translate(${dims.m / 2}, ${dims.m * 1.5})`);

svg.append("text")
    .attr("id", "title-text")
    .attr("x", (dims.m / 2) + (dims.w / 2))
    .attr("y", dims.m * -1)
    .attr("text-anchor", "middle")
    .attr("font-size", 25)
    .text("Bushman Family Travel Log");

let xScale;
let yScale;

const populateViz = () => {

    const full_data = (state.data).map((d,i) => {
        const badges = Object.entries(d.badges);

        const icon_data = Array(4).fill({}).map((d,i) => {
            const x = ((i + 1) * 30) - 15;
            const y = x * (Math.PI / -5.3);
            const col = i == 0 ? "#f15bb5" : i == 1 ? "#9b5de5" : i == 2 ? "#FFA03A" : "#00bbf9";
            let paths = [];
            let icon_name, desc;
    
            if(i == 0) {
                paths.push({
                    d: "M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"
                });
                paths.push({
                    d: "M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"
                });
                icon_name = "Visit";
                desc = "Single experience or multiple in a single location.";
            } else if(i == 1) {
                paths.push({
                    d: "M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"
                });
                paths.push({
                    d: "M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"
                });
                icon_name = "Stay";
                desc = "An overnight stay in the state.";
            } else if(i == 2) {
                paths.push({
                    d: "M16 .5a.5.5 0 0 0-.598-.49L10.5.99 5.598.01a.5.5 0 0 0-.196 0l-5 1A.5.5 0 0 0 0 1.5v14a.5.5 0 0 0 .598.49l4.902-.98 4.902.98a.5.5 0 0 0 .196 0l5-1A.5.5 0 0 0 16 14.5zM5 14.09V1.11l.5-.1.5.1v12.98l-.402-.08a.5.5 0 0 0-.196 0zm5 .8V1.91l.402.08a.5.5 0 0 0 .196 0L11 1.91v12.98l-.5.1z", 
                    fill_rule: "evenodd"
                });
                icon_name = "Tour";
                desc = "Multiple visits & stays throughout the state.";
            } else if(i == 3) {
                paths.push({
                    d: "M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207 1.354 8.853a.5.5 0 1 1-.708-.707z"
                });              
                paths.push({
                    d: "m14 9.293-6-6-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018-5.825-3.764-1.664-6.691 0-5.018"
                });
                icon_name = "Live";
                desc = "Multi-week stays in homes & neighborhoods.";
            }

            return {x, y, col: (badges[i][1] ? col : "#E2E2E2"), icon_name, desc, paths}
        });

        d.icon_data = icon_data;

        return d;
    });

    xScale = d3.scaleLinear()
        .domain(d3.extent(state.data, d => d.x))
        .range([0, dims.w]);

    yScale = d3.scaleLinear()
        .domain(d3.extent(state.data, d => d.y))
        .range([dims.h, 0]);

    const g = svg.selectAll("g")
        .data(full_data)
        .enter()
        .append("g")
        .attr("class", "state-hex")
        .attr("transform", d => `translate(
            ${xScale(d.x)},
            ${yScale(d.y)}
        )`)
        .attr("clip-path", "url(#hexagonClip)")
        .attr("cursor", d => d.image ? "pointer" : "default");
        
    g.filter(d => d.image).on("click", click);

    g.append("image")
        .attr("transform", d => `translate(${-23 + d.adj[0]},${-23 - 4 + d.adj[1]})`)
        .attr("xlink:href", d => d.image ? d.image : "https://www.announcementconverters.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/S/-/S-ILG11F_10.JPG")
        .attr("width", 46)
        .attr("height", 46);

    g.append("rect")
        .attr("transform", "translate(-30,0) rotate(30)")
        .attr("width", 50)
        .attr("height", 10)
        .attr("fill", "white");
        
    g.append("rect")
        .attr("transform", "translate(-10,23) rotate(-30)")
        .attr("width", 50)
        .attr("height", 10)
        .attr("fill", "white");

    g.append("text")
        .attr("transform", "translate(-10.5,15.25) rotate(30)")
        .attr("font-size", d => d.full_name.length >= 12 ? 3 : 3.5)
        .attr("text-anchor", "middle")
        .text(d => d.full_name);

    g.append("g")
        .selectAll("g")
        .data(d => d.icon_data)
        .enter()
        .append("g")
        .attr("transform", d => `scale(0.15) translate(${d.x},${d.y + 122})`)
        .attr("fill", d => d.col)
        .selectAll("path")
        .data(p => p.paths)
        .enter()
        .append("path")
        .attr("d", p => p.d)
        .attr("fill-rule", p => p.fill_rule);

    const legend_data = full_data.filter(d => d.abbrev == 'UT')[0].icon_data
        .map((d,i) => {
            d.x = 0;
            d.y = i * 30;
            return d;
        });

    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(475,215) scale(0.8)");

    legend.append("rect")
        .attr("width", 100)
        .attr("height", 135)
        .attr("fill", "white");

    const icon_entry = legend.selectAll("g")
        .data(legend_data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${10 + d.x},${12 + d.y})`)
        .attr("fill", d => d.col);

    icon_entry.append("g")
        .attr("transform", "scale(0.5)")
        .selectAll("path")
        .data(d => d.paths)
        .enter()
        .append("path")
        .attr("d", d => d.d)
        .attr("fill-rule", d => d.fill_rule);
    
    legend.append("g")
        .selectAll("text")
        .data(legend_data, d => d.paths)
        .enter()
        .append("text")
        .attr("x", 10 + 15)
        .attr("y", d => 19 + d.y)
        .attr("fill", d => d.col)
        .attr("font-size", 8)
        .attr("font-weight", "bold")
        .text(d => d.icon_name);

    legend.append("g")
        .selectAll("text")
        .data(legend_data, d => d.paths)
        .enter()
        .append("text")
        .attr("x", 10)
        .attr("y", d => 28 + d.y)
        .attr("font-size", 5.5)
        .text(d => d.desc)
        .call(wrapText, 80);
}

d3.csv("../../Data files/us-tile-layout.csv")
    .then(layout => {
        d3.json("../../Data files/travel-log.json")
            .then(log => {
                state.data = layout.map(d => {
                    const log_v = log.filter(l => l.abbrev == d.abbrev);

                    d.x = parseFloat(d.x);
                    d.y = parseFloat(d.y);
                    d.badges = log_v.length > 0 ? log_v[0].badges : {visit: false, stay: false, tour: false, live: false};
                    d.adj = log_v.length > 0 ? log_v[0].adj : [0,0];
                    d.image = log_v.length > 0 ? log_v[0].image : undefined;

                    return d;
                })
    
                populateViz();
            })
    })
    .catch((error) => {
        console.error(error);
    });


const modal = new bootstrap.Modal(document.getElementById("stateDetail"), {})

function click() {
    const data = this.__data__;

    d3.select("#modalTitle").text(data.full_name);
    
    d3.select("#modalImg").attr("src", data.image);

    d3.select("#modalBadges").selectAll("i")
        .data(data.icon_data)
        .style("color", d => d.col);

    modal.show();
}