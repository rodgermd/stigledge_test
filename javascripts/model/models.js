/**
 * Edge definition
 * @type {Backbone.Model}
 */
var EdgeDetailsModel = Backbone.Model.extend({
  initialize:function () {
    this.attributes.frequency_descending = this.attributes.frequency - this.attributes.frequency_ascending;
  },
  defaults  :{
    id                         :null,
    from_node_id               :null,
    to_node_id                 :null,
    distance                   :null,
    surface_id                 :null,
    average_velocity_ascending :null,
    average_velocity_descending:null,
    frequency                  :0,
    frequency_ascending        :0,
    frequency_descending       :0,
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

/**
 * Collection of EdgeDetail
 * @type {Backbone.Collection}
 */
var EdgeDetailsCollection = Backbone.Collection.extend({
  model:EdgeDetailsModel,
  /**
   * Tries to get model by id, if it is not found - will use ajax
   * @param id
   * @return {EdgeDetailsModel}
   */
  by_id:function (id) {
    var $this = this;
    if (!this.get(id)) {
      console.log('route ajax load details, id: ', id);
      $.ajax({
        url     :get_api_url('edge/') + id,
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
 * Routes model
 * @type {Backbone.Model}
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
      // load edge detail
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
 * @type {Backbone.Collection}
 */
var RoutesCollection = Backbone.Collection.extend({ model:RouteModel});

/**
 * Polyline model
 * @type {Backbone.Model}
 */
var PolylineModel = Backbone.Model.extend({
  initialize:function () {
    var route_model = this.attributes.route_model;
    var $this = this;

    this.id = route_model.id;

    var route_details = route_model.get('details');
    var frequency = route_details.get('frequency');
    var freq_asc = route_details.get('frequency_ascending');
    var freq_desc = route_details.get('frequency_descending');

    // define polyline width
    var line_weight = parseInt(frequency / 10);
    if (line_weight < 3) line_weight = 3;
    if (line_weight > 15) line_weight = 15;

    var v1 = Math.floor(Math.random() * 9);
    var v2 = Math.floor(Math.random() * 9);
    var v3 = Math.floor(Math.random() * 9);

    var color = '#' + v1 + v1 + v2 + v2 + v3 + v3;

    var lineSymbol = {
      path       :freq_asc > freq_desc ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor  :color,
      fillOpacity:1,
      scale      :1.5
    };

    var polyline = new google.maps.Polyline({
      strokeColor  :color,
      strokeOpacity:.7,
      strokeWeight :line_weight,
      // use icon only if frequency in one way is more than another in 3 times or more
      icons        :( freq_asc / freq_desc >= 3 || freq_desc / freq_asc >= 3 ) ? [
        { icon:lineSymbol, offset:'50%'}
      ] : null
    });

    $this.attributes.points_reversed = new Array();
    $this.attributes.bounding_box = new google.maps.LatLngBounds();

    // prepare path, reverse path and bounding box
    _.each(route_model.get('points'), function (point) {
      polyline.getPath().push(point); // add point in normal way
      $this.get('points_reversed').unshift(point); // prepend point to reversed array
      $this.get('bounding_box').extend(point);
    });

    this.attributes.polyline = polyline;
  },
  defaults  :{
    id                :null,
    has_attached_event:false,
    polyline          :null,
    points_reversed   :null,
    bounding_box      :null
  },
  /**
   * Attaches or detaches polyline to the map
   * @param map
   */
  setMap    :function (map) {
    this.get('polyline').setMap(map);
  }
});

/**
 * Polylines collection definition
 * @type {Backbone.Collection}
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
 * Default google map options
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

/**
 * Caches loaded ajax data edge/detail
 * @type {EdgeDetailsCollection}
 */
var loaded_edge_details = new EdgeDetailsCollection();