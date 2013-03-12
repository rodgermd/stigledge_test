/**
 * Edge definition
 * @type {Backbone.Model.extend}
 */
var EdgeDetailsModel = Backbone.Model.extend({
  defaults:{
    id                         :null,
    from_node_id               :null,
    to_node_id                 :null,
    distance                   :null,
    surface_id                 :null,
    average_velocity_ascending :null,
    average_velocity_descending:null,
    frequency                  :null,
    frequency_ascending        :null,
    lat_min                    :null,
    lat_max                    :null,
    lng_min                    :null,
    lng_max                    :null,
    ascent                     :null,
    descent                    :null,
    edge_rank                  :null,
    num_clicks                 :null
  }
});

var EdgeDetailsCollection = Backbone.Collection.extend({
  model:EdgeDetailsModel,
  by_id:function (id) {
    var $this = this;
    if (!this.get(id)) {
      console.log('route ajax load details, id: ', id);
      $.ajax({
        url     :'http://stiglede.eu01.aws.af.cm/api/edge/' + id,
        async   :false,
        dataType:'json',
        success :function (json) {
          var data = json.edge[id];
          $this.add(new EdgeDetailsModel(data));
        }
      });
    }
    return this.get(id);
  }
});

/**
 * Point definition
 * @type {Backbone.Model.extend}
 */
var RouteModel = Backbone.Model.extend({
  initialize:function () {
    // normalize points
    if (this.attributes.points_raw.lat.length) {
      var points_raw = this.get('points_raw');
      this.attributes.points = new Array();
      for (var index in points_raw.lat) {
        this.get('points').push(new google.maps.LatLng(points_raw.lat[index], points_raw.lng[index]));
      }
      // unset raw data
      delete this.attributes.points_raw;
      this.attributes.details = loaded_edge_details.by_id(this.id);
    }
  },
  defaults  :{
    id     :null,
    points :null,
    details:null
  }
});

/**
 * Points collection definition
 * @type {Backbone.Model.extend}
 */
var RoutesCollection = Backbone.Collection.extend({ model:RouteModel});

var PolylineModel = Backbone.Model.extend({
  initialize:function () {
    var route_model = this.attributes.route_model;
    this.id = route_model.id;

//    console.log('details: ', route_model.get('details'), 'num clicks: ', route_model.get('details').get('num_clicks'));
    var line_weight = parseInt(route_model.get('details').get('num_clicks') / 10);
    if (line_weight < 3) line_weight = 3;
    if (line_weight > 15) line_weight = 15;

    var v1 = Math.floor(Math.random() * 10);
    var v2 = Math.floor(Math.random() * 10);
    var v3 = Math.floor(Math.random() * 10);
    var polyline = new google.maps.Polyline({
      strokeColor  :'#' + v1 + v2 + v3,
      strokeOpacity:1.0,
      strokeWeight :line_weight
    });

    _.each(route_model.get('points'), function (point) {
      polyline.getPath().push(point);
    });

    this.attributes.polyline = polyline;
  },
  defaults  :{
    id      :null,
    polyline:null
  },
  setMap    :function (map) {
    this.get('polyline').setMap(map);
  }
});

/**
 * Plylines collection definition
 * @type {Backbone.Model.extend}
 */
var PolylinesCollection = Backbone.Collection.extend({
  model :PolylineModel,
  setMap:function (map) {
    this.each(function (polyline) {
      polyline.setMap(map);
    });
  }
});

/**
 * Map options
 */
var map_options = {
  lat      :59.912181,
  lng      :10.765572,
  zoom     :12,
  mapTypeId:google.maps.MapTypeId.ROADMAP,

  center:function () {
    return new google.maps.LatLng(this.lat, this.lng);
  }
};

var loaded_edge_details = new EdgeDetailsCollection();