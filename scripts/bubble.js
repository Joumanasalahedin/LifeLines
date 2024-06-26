var margin = { top: 40, right: 30, bottom: 80, left: 80 },
    width = 1000 - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;

var svg = d3.select("#bubbleContainer")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#f5f5f5")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("#tooltip");

var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

var z = d3.scaleSqrt()
    .domain([0, 1310000000])
    .range([2, 20]);

var myColor = d3.scaleOrdinal()
    .domain(["Asia", "Europe", "North America", "South America", "Africa", "Oceania"])
    .range(["#F0803C", "#8F0079", "#6DB1BF", "#E462A8", "#838B55", "#324A5F"]);

var xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")");

var yAxis = svg.append("g");

function make_y_gridlines() {
    return d3.axisLeft(y)
        .ticks(7);
}

function make_x_gridlines() {
    return d3.axisBottom(x)
        .ticks(10);
}

function updateGridLines() {
    // Update the gridlines
    svg.select(".x.grid").call(make_x_gridlines()
        .tickSize(-height)
        .tickFormat(""));
    svg.select(".y.grid").call(make_y_gridlines()
        .tickSize(-width)
        .tickFormat(""));

    var xTicks = x.ticks(5);
    var yTicks = y.ticks(2);

    svg.selectAll(".x-mid-tick").remove();
    svg.selectAll(".y-mid-tick").remove();

    for (let i = 0; i < xTicks.length - 1; i++) {
        let midX = (xTicks[i] + xTicks[i + 1]) / 2;
        svg.append("line")
            .attr("class", "x-mid-tick")
            .attr("x1", x(midX))
            .attr("y1", 0)
            .attr("x2", x(midX))
            .attr("y2", height)
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "3,3");
    }

    for (let i = 0; i < yTicks.length - 1; i++) {
        let midY = (yTicks[i] + yTicks[i + 1]) / 2;
        svg.append("line")
            .attr("class", "y-mid-tick")
            .attr("x1", 0)
            .attr("y1", y(midY))
            .attr("x2", width)
            .attr("y2", y(midY))
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "3,3");
    }
}

svg.append("g")
    .attr("class", "x grid")
    .attr("transform", "translate(0," + height + ")");

svg.append("g")
    .attr("class", "y grid");

svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 30)
    .text("Birth Rate per 1,000 people")
    .style("font-weight", "bold");

svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 30)
    .attr("x", -height / 2)
    .text("Life Expectancy")
    .style("font-weight", "bold");

var globalData;
var years = [];

// Load data and initialize the chart
d3.csv("data/bubble_data.csv", function (error, data) {
    if (error) throw error;
    globalData = data;

    data.forEach(function (d) {
        d.Year = +d.Year;
        d['Birth rate'] = +d['Birth rate'];
        d['Period life expectancy at birth'] = +d['Period life expectancy at birth'];
        d['Population'] = +d['Population'];
    });

    years = d3.map(data, function (d) { return d.Year; }).keys().sort(d3.ascending);

    var selector = d3.select("#yearSelector");
    var slider = document.getElementById("yearSlider");
    var yearDisplay = document.getElementById("yearDisplay");

    slider.min = 0;
    slider.max = years.length - 1;
    slider.value = years.length - 1;

    selector.selectAll('option')
        .data(years)
        .enter().append('option')
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
        .property("selected", function (d) { return d === years[years.length - 1]; });

    yearDisplay.textContent = years[slider.value];
    updateChart(years[slider.value], globalData);

    selector.on("change", function () {
        var selectedYear = d3.select(this).property("value");
        slider.value = years.indexOf(selectedYear);
        yearDisplay.textContent = selectedYear;
        updateChart(selectedYear, globalData);
    });

    slider.oninput = function () {
        var yearIndex = this.value;
        var selectedYear = years[yearIndex];
        yearDisplay.textContent = selectedYear;
        selector.property('value', selectedYear);
        updateChart(selectedYear, globalData);
    };

    // Create legend
    var legend = d3.select("#legend");

    var legendData = myColor.domain().map(function (d, i) {
        return {
            color: myColor(d),
            continent: d
        };
    });

    var legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("div")
        .attr("class", "legend-item");

    legendItems.append("div")
        .attr("class", "legend-color")
        .style("background-color", function (d) { return d.color; });

    legendItems.append("span")
        .text(function (d) { return d.continent; });
});

function updateChart(year, data) {
    var yearData = data.filter(d => d.Year == year);

    // Update the domains of the scales
    x.domain([d3.min(yearData, d => d['Birth rate']), d3.max(yearData, d => d['Birth rate'])]);
    y.domain([d3.min(yearData, d => d['Period life expectancy at birth']), d3.max(yearData, d => d['Period life expectancy at birth'])]);

    xAxis.transition().duration(1000).call(d3.axisBottom(x));
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    updateGridLines();

    var circles = svg.selectAll("circle")
        .data(yearData);

    circles.enter()
        .append("circle")
        .merge(circles)
        .attr("cx", function (d) { return x(d['Birth rate']); })
        .attr("cy", function (d) { return y(d['Period life expectancy at birth']); })
        .attr("r", function (d) { return z(d['Population']); })
        .style("fill", function (d) { return myColor(d['Continent']); })
        .style("opacity", "0.7")
        .attr("stroke", "black")
        .style("stroke-width", "0.2px")
        .on("mouseover", function (d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html("<strong>" + d.Entity + "</strong>" +
                "<br/>Birth Rate: " + d['Birth rate'].toFixed(2) +
                "<br/>Life Expectancy: " + d['Period life expectancy at birth'].toFixed(2) + " years" +
                "<br/>Population: " + d['Population'].toLocaleString())
                .style("left", (d3.event.pageX - 75) + "px")
                .style("top", (d3.event.pageY - 90) + "px");

            circles.style("opacity", 0.2);
            d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
            circles.style("opacity", 0.7);
        });

    circles.exit().remove();

    // Label and leader lines
    var additionalLabels = ["China", "Egypt", "Saudi Arabia", "United States", "Germany"];
    var gridSizeX = width / 5;
    var gridSizeY = height / 5;
    var grid = {};

    function getGridCell(x, y) {
        var col = Math.floor(x / gridSizeX);
        var row = Math.floor(y / gridSizeY);
        return col + "-" + row;
    }

    var sortedData = yearData.sort(function (a, b) {
        return d3.ascending(+a['Birth rate'], +b['Birth rate']) || d3.ascending(+a['Period life expectancy at birth'], +b['Period life expectancy at birth']);
    });

    var dynamicallyLabeledData = [];
    sortedData.forEach(function (d) {
        var cx = x(d['Birth rate']);
        var cy = y(d['Period life expectancy at birth']);
        var cell = getGridCell(cx, cy);
        if (!grid[cell]) {
            dynamicallyLabeledData.push(d);
            grid[cell] = true;
        }
    });

    var labeledData = dynamicallyLabeledData.concat(
        yearData.filter(function (d) {
            return additionalLabels.includes(d.Entity) && !dynamicallyLabeledData.find(l => l.Entity === d.Entity);
        })
    );

    var labels = svg.selectAll("text.label")
        .data(labeledData);

    labels.enter()
        .append("text")
        .attr("class", "label")
        .merge(labels)
        .attr("x", function (d) {
            var baseX = x(d['Birth rate']);
            return d['Population'] > 100000000 ? baseX + z(d['Population']) + 5 : baseX;
        })
        .attr("y", function (d) {
            var baseY = y(d['Period life expectancy at birth']);
            return d['Population'] > 100000000 ? baseY - z(d['Population']) : baseY - 15;
        })
        .text(function (d) { return d.Entity; })
        .attr("font-size", "15px")
        .attr("text-anchor", function (d) {
            return d['Population'] > 100000000 ? "start" : "middle";
        })
        .attr("alignment-baseline", "middle")
        .style("fill", function (d) { return myColor(d['Continent']); })
        .attr("font-weight", "bolder")
        .style("text-shadow", "1px 0px 0px white");

    labels.exit().remove();

    var lines = svg.selectAll("line.leader")
        .data(labeledData);

    lines.enter()
        .append("line")
        .attr("class", "leader")
        .merge(lines)
        .attr("x1", function (d) { return x(d['Birth rate']); })
        .attr("y1", function (d) { return y(d['Period life expectancy at birth']); })
        .attr("x2", function (d) {
            var baseX = x(d['Birth rate']);
            return d['Population'] > 100000000 ? baseX + z(d['Population']) + 5 : baseX;
        })
        .attr("y2", function (d) {
            var baseY = y(d['Period life expectancy at birth']);
            return d['Population'] > 100000000 ? baseY - z(d['Population']) : baseY - 15;
        })
        .attr("stroke", "grey")
        .style("stroke-dasharray", ("3, 3"));

    lines.exit().remove();
}
