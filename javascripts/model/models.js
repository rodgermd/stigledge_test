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
        url     :get_api_url('edge/' + id),
        async   :false,
        dataType:'json',
        success :function (json) {
          $this.add(new EdgeDetailsModel(json));
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
  initialize: function () {
   this.attributes.points = [];
    if (this.get('latLng').length) {
      var points_raw = this.get('latLng');
      for (var index in points_raw) {
        this.get('points').push(new google.maps.LatLng(points_raw[index].lat, points_raw[index].lng));
      }
      this.attributes.polyline = new PolylineModel({route: this});
      // unset raw data
      delete this.attributes.latLng;
    }
  },
  defaults  : {
    id                  : null,
    points              : null,
    polyline            : null,
    marker              : null,
    frequency           : 0,
    frequency_ascending : 0,
    frequency_descending: 0,
    surface_id          : null
  }
});

/**
 * Points collection definition
 * @type {Backbone.Collection}
 */
var RoutesCollection = Backbone.Collection.extend({
  model: RouteModel
});

/**
 * Polyline model
 * @type {Backbone.Model}
 */
var PolylineModel = Backbone.Model.extend({
  initialize: function () {
    var route_model = this.attributes.route;
    var $this = this;

    this.id = route_model.id;

    var frequency = route_model.get('frequency');
    var freq_asc = route_model.get('frequency_ascending');
    var freq_desc = route_model.get('frequency_descending');

    // define polyline width
    var line_weight = parseInt(frequency / 10);
    if (line_weight < 3) line_weight = 3;
    if (line_weight > 15) line_weight = 15;

    var color = this.get_color(route_model.get('surface_id'));
    console.log(route_model.get('surface_id'), color);

    var lineSymbol = {
      path       : freq_asc > freq_desc ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      fillColor  : "#009900",
      fillOpacity: 1,
      strokeColor: "#fff",
      strokeWeight: 1,
      scale      : 3
    };

    var polyline = new google.maps.Polyline({
      strokeColor  : color,
      strokeOpacity: .7,
      strokeWeight : line_weight,
      // use icon only if frequency in one way is more than another in 3 times or more
      icons        : ( freq_asc / freq_desc >= 3 || freq_desc / freq_asc >= 3 ) ? [
        { icon: lineSymbol, offset: '50%'}
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
  defaults  : {
    id                : null,
    route             : null,
    polyline          : null,
    points_reversed   : null,
    bounding_box      : null
  },
  get_color: function(surface_id) {
    var color = '#999';
    switch(surface_id)
    {
      case '1': color = 'blue'; break;
      case '2': color = 'magenta'; break;
      case '3': color = 'black'; break;
    }
    return color;
  }

});

/**
 * Default google map options
 */
var map_options = {
  lat      : 59.912181,
  lng      : 10.765572,
  zoom     : 12,
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  center   : function () {
    return new google.maps.LatLng(this.lat, this.lng);
  }
};