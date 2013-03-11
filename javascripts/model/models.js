/**
 * Edge definition
 * @type {Backbone.Model.extend}
 */
var EdgeModel = new Backbone.Model.extend({
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

/**
 * Edges collection definition
 * @type {Backbone.Model.extend}
 */
var EdgesCollection = new Backbone.Collection.extend({model:EdgeModel});

/**
 * Point definition
 * @type {Backbone.Model.extend}
 */
var PointModel = new Backbone.Model.extend({
  defaults:{
    id :null,
    lat:null,
    lng:null
  }
});

/**
 * Points collection definition
 * @type {Backbone.Model.extend}
 */
var PointsCollection = new Backbone.Collection.extend({model:PointModel});

/**
 * Map options
 * @type {Backbone.Model.extend}
 */
var map_options = {
  lat           :59.912181,
  lng           :10.765572,
  zoom          :16,
  mapTypeControl:false,
  mapTypeId     :google.maps.MapTypeId.ROADMAP,

  center:function () {
    return new google.maps.LatLng(this.lat, this.lng);
  }
};