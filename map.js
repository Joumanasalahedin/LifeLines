var svg = d3.select("#my_dataviz"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var tooltip = d3.select("#tooltip");

var projection = d3.geoNaturalEarth1()
    .scale(width / 1.3 / Math.PI)
    .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

var globalData; // Store the data globally after initial load
var colorScale = d3.scaleThreshold()
    .domain([40, 45, 50, 55, 60, 65, 70, 75, 80, 85])
    .range([
        "#cbe4ad", "#acdba8", "#8bd2a7", "#66c8aa", "#3cb7b0",
        "#10a4b3", "#0091b0", "#0071a6", "#005198", "#002f80", "#19005e"
    ]);

// Define the SVG for the legend
document.addEventListener("DOMContentLoaded", function () {
    var containerWidth = document.getElementById('mapContainer').clientWidth;
    var adjustedWidth = containerWidth - (parseFloat(window.getComputedStyle(document.getElementById('mapContainer'), null).getPropertyValue('padding-left')) + parseFloat(window.getComputedStyle(document.getElementById('mapContainer'), null).getPropertyValue('padding-right')));
    var legendWidthFraction = 0.7; // 80% of the container width
    var legendWidth = adjustedWidth * legendWidthFraction;

    var legendSvg = d3.select('#legend')
        .attr('width', legendWidth)
        .attr('height', 50);

    // Draw the legend
    var legendWidth = +legendSvg.attr("width"),
        legendHeight = +legendSvg.attr("height"),
        legendSegmentWidth = legendWidth / colorScale.range().length;

    legendSvg.selectAll("rect")
        .data(colorScale.range().map(function (color) {
            var d = colorScale.invertExtent(color);
            if (d[0] == null) d[0] = colorScale.domain()[0] - 10;
            if (d[1] == null) d[1] = colorScale.domain()[colorScale.domain().length - 1];
            return d;
        }))
        .enter().append("rect")
        .style("fill", function (d) { return colorScale(d[0]); })
        .attr("x", function (d, i) { return legendSegmentWidth * i; })
        .attr("y", 0)
        .attr("width", legendSegmentWidth)
        .attr("height", legendHeight - 20);


    legendSvg.selectAll("text")
        .data(colorScale.domain())
        .enter().append("text")
        .attr("x", function (d, i) { return (i + 1) * legendSegmentWidth }) // Center the text
        .attr("y", legendHeight - 5)
        .attr("text-anchor", "middle") // Make sure this is set to "middle"
        .text(function (d) { return d + " years"; });
});

d3.csv("data/life-expectancy.csv", function (error, data) {
    if (error) throw error;
    globalData = data;

    var years = d3.map(data, function (d) { return d.Year; }).keys().sort(d3.ascending);
    var selector = d3.select("#yearSelector");
    var slider = document.getElementById("yearSlider");
    var yearDisplay = document.getElementById("yearDisplay");

    // Configure slider based on indices of years array
    slider.min = 0;
    slider.max = years.length - 1;
    slider.value = years.length - 1; // Set the initial value to the last index

    // Populate the dropdown
    selector.selectAll('option')
        .data(years)
        .enter().append('option')
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
        .property("selected", function (d) { return d === years[years.length - 1]; });

    // Sync display and update map initially
    yearDisplay.textContent = years[slider.value];
    updateMap(years[slider.value], globalData);

    // Event listener for the selector
    selector.on("change", function () {
        var selectedYear = d3.select(this).property("value");
        slider.value = years.indexOf(selectedYear); // Update slider position based on year index
        yearDisplay.textContent = selectedYear;
        updateMap(selectedYear, globalData);
    });

    // Event listener for the slider
    slider.oninput = function () {
        var yearIndex = this.value;
        var selectedYear = years[yearIndex];
        yearDisplay.textContent = selectedYear;
        selector.property('value', selectedYear);
        updateMap(selectedYear, globalData);
    };


});


function updateMap(year, data) {
    var yearData = data.filter(d => d.Year === year);
    var lifeExpectancyByCountry = {};
    yearData.forEach(function (d) {
        lifeExpectancyByCountry[d.Code] = +d["Period life expectancy at birth"];
    });

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function (error, mapData) {
        if (error) return console.error("GeoJSON loading error:", error);

        mapData.features.forEach(function (feature) {
            feature.properties.lifeExpectancy = lifeExpectancyByCountry[feature.id] || null;
        });

        var paths = svg.selectAll("path")
            .data(mapData.features);

        paths.enter().append("path")
            .merge(paths)
            .attr("d", path)
            .attr("fill", function (d) {
                return d.properties.lifeExpectancy ? colorScale(d.properties.lifeExpectancy) : "#cccccc";
            })
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", function (d) {
                var prop = d.properties;
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html("Country: " + (d.properties.name || "Unknown") + "<br>Life Expectancy: " +
                    (d.properties.lifeExpectancy ? d.properties.lifeExpectancy.toFixed(2) : "No data"))
                    .style("left", (d3.event.pageX - 60) + "px")
                    .style("top", (d3.event.pageY - 100) + "px");

                // Highlight the hovered country
                d3.select(this)
                    .attr("stroke", "white")
                    .attr("stroke-width", 2);

                // Dim other countries
                svg.selectAll("path")
                    .style("opacity", 0.5);
                d3.select(this)
                    .style("opacity", 1);
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                // Reset stroke styles
                d3.select(this)
                    .attr("stroke", "white")
                    .attr("stroke-width", 1);

                // Reset fill to handle countries with no data
                svg.selectAll("path")
                    .attr("fill", function (d) {
                        return d.properties.lifeExpectancy ? colorScale(d.properties.lifeExpectancy) : "#cccccc"; // Use the default color for no data
                    })
                    .style("opacity", 1);
            });

        paths.exit().remove(); // Remove unused paths
    });
}
