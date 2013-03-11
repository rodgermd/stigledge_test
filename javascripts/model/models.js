/**
 * Edge definition
 * @type {Backbone.Model.extend}
 */
var Edge = new Backbone.Model.extend({
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
var EdgesCollection = new Backbone.Collection.extend({model:Edge});

/**
 * Point definition
 * @type {Backbone.Model.extend}
 */
var Point = new Backbone.Model.extend({
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
var PointsCollection = new Backbone.Collection.extend({model:Point});

/**
 * Map options
 * @type {Backbone.Model.extend}
 */
var MapOptions = new Backbone.Model.extend({
  defaults:{
    lat :59.912181,
    lng :10.765572,
    zoom:16,
    maptype: new google.maps
  }
});
