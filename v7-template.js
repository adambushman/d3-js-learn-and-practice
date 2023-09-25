// Global variables
const state = {
    data: [], 
    selections: {}
}

// Filter the raw data according to user selection
function filterData() {
    
}

// Wrangle data based on structure
function wrangleData(filtered) {
    
}

// Visualization logic
function createVis() {
    // Setup vis structure: SVG, scales, etc.

    function update(new_data) {
    // Joins data to elements, specifying enter, update, exit logic

    }

    // Return the update function to be called later
    return update;
}
  
// Create an instance of the visualization
const vis = createVis();

// Update the application based on new data via event handlers
function updateApp() {
    // Generate new data from updated parameters
    const filtered = filterData();
    const new_data = wrangleData(filtered);

    // Update visualization
    vis(new_data);
}
  
// Initialize even handlers
d3.select("#something").on('click', () => {
    // update state
    updateApp();
})

// Load data files
d3.queue()
    .defer(d3.csv, "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ut_utah_zip_codes_geo.min.json") // UT file
    .defer(d3.csv, "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ri_rhode_island_zip_codes_geo.min.json") // RI file
    .await((error, data1, data2) => {
        if (error) throw error;

        console.log(data1); // Preview UT file
        console.log(data2); // Preview RI file
    })