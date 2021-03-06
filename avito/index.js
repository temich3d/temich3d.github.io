function makeBarChart(ndx, filed, id, interval, width, height) {
  var dim = ndx.dimension((x) => x[filed]);
  var group = dim.group();

  if (!interval)
    interval = [dim.bottom(1)[0][filed], dim.top(1)[0][filed]];

  if (!width) width = 360;
  if (!height) height = 130;

  var chart = dc.barChart(id);

  chart.width(width);
  chart.height(height);

  chart.margins({ top: 10, right: 5, bottom: 20, left: 40 });
  chart.dimension(dim).group(group);
  chart.x(d3.scale.linear().domain(interval));
  chart.elasticY(true);
  chart.yAxis().ticks(4);
  chart.transitionDuration(500);

  return chart;
}

function makeRowChart(ndx, filed, id, colors, width, height) {
  var dim = ndx.dimension((x) => x[filed]);
  var group = dim.group();

  if (!width) width = 200;
  if (!height) height = 120;

  var chart  = dc.rowChart(id);

  if (!colors) colors = ['#f77', '#a55'];

  chart.width(width);
  chart.height(height);
  chart.margins({ top: 10, right: 50, bottom: 20, left: 40 });
  chart.dimension(dim).group(group);
  chart.elasticX(true);
  chart.xAxis().ticks(4);
  chart.transitionDuration(500);
  chart.colors(colors);

  return chart;
}

var heatmapOn = true;
var markersOn = true;

function processData(records) {
  records = _.filter(records, (x) => x.price != 0);

  records.forEach(function(rec) {
    rec.lat = +rec.lat;
    rec.lon = +rec.lon;
    rec.price = +rec.price / 1000;
    rec.sqPrice = +rec.sqPrice / 1000;
    rec.sq = +rec.sq;
  });

  var ndx = crossfilter(records);

  var allDim   = ndx.dimension((x) => x);
  var all        = ndx.groupAll();

  console.log(records[0]);

  var numberRecordsND = dc.numberDisplay('#numberRecords');
  var priceChart      = makeBarChart(ndx, 'price', '#priceChart');
  var sqChart         = makeBarChart(ndx, 'sq', '#sqChart');
  var phoneChart      = makeBarChart(ndx, 'phoneCnt', '#numberPhone');
  var agencyRowChart  = makeRowChart(ndx, 'agency', '#agency');
  var typeRowChart    = makeRowChart(ndx, 'type', '#typeChart');
  var floorChart      = makeBarChart(ndx, 'floor', '#floorChart');
  var maxFloorChart   = makeBarChart(ndx, 'maxFloor', '#maxFloorChart');
  var sqPriceChart    = makeBarChart(ndx, 'sqPrice', '#sqPriceChart');
  /*
  var commChart       = makeBarChart(ndx, 'comm', '#commChart');
  var deposChart      = makeBarChart(ndx, 'depos', '#deposChart');
 */

  var dcCharts = [priceChart, sqChart, phoneChart, agencyRowChart,
    typeRowChart, floorChart, maxFloorChart, sqPriceChart];

  numberRecordsND
    .formatNumber(d3.format("d"))
    .valueAccessor((x) => x)
    .group(all);

  var map = L.map('map').setView([48.5, 44.5], 9);
  var drawMap = function() {
    var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
      'http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: mapLink
      }).addTo(map);

    if (heatmapOn) {
      var geoData = [];
      _.each(allDim.top(Infinity), function (d) {
        geoData.push([d["lat"], d["lon"], 1]);
      });

      var heat = L.heatLayer(geoData,{
        radius: 10,
        blur: 20, 
        maxZoom: 1,
      }).addTo(map);
    }

    if (markersOn) {
      var markers = L.markerClusterGroup();
      _.each(allDim.top(Infinity), function (d) {
        // console.log(d);
        var title = d.name;
        var marker = L.marker(new L.LatLng(d.lat, d.lon), { title: title });
        marker.bindPopup('<a href="' + d.link + '">' + d.name + '</a>');
        markers.addLayer(marker);
      });

      map.addLayer(markers);
    }
  }

  function redrawMap() {
    map.eachLayer(function (layer) {
      map.removeLayer(layer)
    }); 
    drawMap();
  }

  _.each(dcCharts, function (dcChart) {
    dcChart.on("filtered", redrawMap);
  });

  dc.renderAll();
  drawMap();

  $("#toggleHeatmap").click(function() {
    heatmapOn = !heatmapOn;
    if (heatmapOn) {
      $('#toggleHeatmap').text('Отключить heatmap');
    } else {
      $('#toggleHeatmap').text('Включить heatmap');
    }

    redrawMap();
  });

  $("#toggleMarkers").click(function() {
    markersOn = !markersOn;
    if (markersOn) {
      $('#toggleMarkers').text('Отключить маркеры');
    } else {
      $('#toggleMarkers').text('Включить маркеры');
    }

    redrawMap();
  });
}

$.getJSON("showId2.json", processData);
