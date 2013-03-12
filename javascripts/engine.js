$(function () {
  var MapView = Backbone.View.extend({
    events           :{
      'map.initialize':'on_map_initialize'
    },
    initialize       :function () {
      var resize_timeout;
      var $this = this;
      this.$el = $('#map-container');
      $(window).on('resize', function () {
        clearInterval(resize_timeout);
        resize_timeout = setTimeout($.proxy($this.resize_map_holder, $this), 500);
      });
      this.resize_map_holder();
    },
    on_map_initialize:function () {
      map = new google.maps.Map(this.$el.get(0), $.extend(map_options, {
        center:map_options.center(),
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.TERRAIN,
            'osm', 'topo2', 'topo2raster', 'topo2graatone'
          ]
        }
      }));

      var osmMapType = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
          return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
        },
        tileSize: new google.maps.Size(256, 256),
        isPng: true,
        alt: "OpenStreetMap",
        name: "OSM",
        maxZoom: 19
      });
      var topo2MapType = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
          return 'http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom=' + zoom + '&x=' + coord.x + '&y=' + coord.y; },
        tileSize: new google.maps.Size(256, 256),
        isPng: true,
        alt: "Statens Kartverk Topografiske Norgeskart",
        name: "Statkart Topo",
        maxZoom: 19
      });
      var toporaster2MapType = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
          return 'http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster2&zoom=' + zoom + '&x=' + coord.x + '&y=' + coord.y; },
        tileSize: new google.maps.Size(256, 256),
        isPng: true,
        alt: "Statens Kartverk Topografiske Norgeskart",
        name: "Statkart Toporaster",
        maxZoom: 19
      });
      var topo2graatoneMapType = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
          return 'http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2graatone&zoom=' + zoom + '&x=' + coord.x + '&y=' + coord.y; },
        tileSize: new google.maps.Size(256, 256),
        isPng: true,
        alt: "Statens Kartverk Topografiske Norgeskart",
        name: "Statkart Gratone",
        maxZoom: 19
      });

      map.mapTypes.set('osm', osmMapType);
      map.mapTypes.set('topo2', topo2MapType);
      map.mapTypes.set('topo2raster', toporaster2MapType);
      map.mapTypes.set('topo2graatone', topo2graatoneMapType);

    },
    render           :function () {
      if (!this.is_initialized()) {
        this.$el.trigger('map.initialize');
      }
    },
    // checks if map is initialized
    is_initialized   :function () {
      return typeof map != 'undefined';
    },
    // resizes map
    resize_map_holder:function () {
      var h = $(window).height() - this.$el.offset().top - $('#root-footer').height();
      this.$el.height(h);
      if (map) google.maps.event.trigger(map, 'resize');
    }


  });


//
//  var RoutesListView = new Backbone.View.extend({
//
//  });
//
//  var ElevationChartView = new Backbone.View.extend({
//
//  });


  var AppController = Backbone.Router.extend({
    routes :{
      ""          :'general'
    },
    general:function () {
      return new MapView().render();
    }
  });

  var map;
  var app = new AppController();
  Backbone.history.start();
});