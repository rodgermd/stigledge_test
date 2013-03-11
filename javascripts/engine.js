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
      map = new google.maps.Map(this.$el.get(0), $.extend(map_options, { center:map_options.center() }));
    },
    render           :function () {
      if (!this.is_initialized()) {
        this.$el.trigger('map.initialize');
      }
      var controls = new ControlsView().render().$el;
      controls.appendTo(this.$el);
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

  /**
   * Map controls renderer
   */
  var ControlsView = Backbone.View.extend({
    template       :_.template($('#map-type-controls').html()),
    events         :{
      "click .switches-map-type":"switch_map_type"
    },
    render         :function () {
      this.$el.html(this.template({ maptype:'hybrid' }));
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(this.el);
      return this;
    },
    switch_map_type:function (e) {
      var $link = $(e.target);
      console.log(this, $link);
      var match = $link.attr('class').match(/map-type-([\w\d]+)/);
      if (match.length < 2) return;
      var type_id = match[1];
      map.setMapTypeId(type_id);
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
      ""          :'general',
      "!:map_type":"maptype"
    },
    general:function () {
      return new MapView().render();
    },
    maptype: function(maptype) {
      map_options.mapTypeId = google.maps.MapTypeId[maptype.toUpperCase()];
      return new MapView().render();
    }
  });

  var map;
  var app = new AppController();
  Backbone.history.start();
});