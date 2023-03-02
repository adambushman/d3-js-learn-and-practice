d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ut_utah_zip_codes_geo.min.json") // UT file
    .defer(d3.json, "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ri_rhode_island_zip_codes_geo.min.json") // RI file
    .await((error, data1, data2) => {
        if (error) throw error;

        console.log(data1); // Preview UT file
        console.log(data2); // Preview RI file
    })