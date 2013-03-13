$(function () {
  var MapView = Backbone.View.extend({
    routes_view      :null,
    events           :{
      'map.initialize':'on_map_initialize',
      'loading_start' : 'on_routes_loading_start',
      'loading_finished' : 'on_routes_loading_finished'
    },
    init             :function () {
      this.$el.trigger('map.initialize');
      return this;
    },
    initialize       :function () {
      var resize_timeout;
      var $this = this;
      this.$el = $('#map-container');
      $(window).on('resize', function () {
        clearInterval(resize_timeout);
        resize_timeout = setTimeout($.proxy($this.resize_map_holder, $this), 500);
      });
      this.routes_view = new RoutesView();
      this.resize_map_holder();
    },
    on_map_initialize:function () {
      map = new google.maps.Map($('#map', this.$el).get(0), $.extend(map_options, {
        center               :map_options.center(),
        mapTypeControlOptions:{
          style     :google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          mapTypeIds:[
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.TERRAIN,
            'osm', 'topo2', 'topo2raster', 'topo2graatone'
          ]
        }
      }));

      var osmMapType = new google.maps.ImageMapType({
        getTileUrl:function (coord, zoom) {
          return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
        },
        tileSize  :new google.maps.Size(256, 256),
        isPng     :true,
        alt       :"OpenStreetMap",
        name      :"OSM",
        maxZoom   :19
      });
      var topo2MapType = new google.maps.ImageMapType({
        getTileUrl:function (coord, zoom) {
          return 'http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom=' + zoom + '&x=' + coord.x + '&y=' + coord.y;
        },
        tileSize  :new google.maps.Size(256, 256),
        isPng     :true,
        alt       :"Statens Kartverk Topografiske Norgeskart",
        name      :"Statkart Topo",
        maxZoom   :19
      });
      var toporaster2MapType = new google.maps.ImageMapType({
        getTileUrl:function (coord, zoom) {
          return 'http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=toporaster2&zoom=' + zoom + '&x=' + coord.x + '&y=' + coord.y;
        },
        tileSize  :new google.maps.Size(256, 256),
        isPng     :true,
        alt       :"Statens Kartverk Topografiske Norgeskart",
        name      :"Statkart Toporaster",
        maxZoom   :19
      });
      var topo2graatoneMapType = new google.maps.ImageMapType({
        getTileUrl:function (coord, zoom) {
          return 'http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2graatone&zoom=' + zoom + '&x=' + coord.x + '&y=' + coord.y;
        },
        tileSize  :new google.maps.Size(256, 256),
        isPng     :true,
        alt       :"Statens Kartverk Topografiske Norgeskart",
        name      :"Statkart Gratone",
        maxZoom   :19
      });

      map.mapTypes.set('osm', osmMapType);
      map.mapTypes.set('topo2', topo2MapType);
      map.mapTypes.set('topo2raster', toporaster2MapType);
      map.mapTypes.set('topo2graatone', topo2graatoneMapType);

      var $this = this;
      var load_edges_callback = $.proxy($this.render_routes, $this);

      var autocomplete = new google.maps.places.Autocomplete($("#autocomplete-field", this.$el).get(0));
      autocomplete.bindTo('bounds', map);

      // wait for map initialize complete
      setTimeout(function () {
        google.maps.event.addListener(map, 'dragstart', function(){ $this.$el.trigger('loading_start');});
        google.maps.event.addListener(map, 'dragend', function(){ $this.$el.trigger('loading_finished');});
        google.maps.event.addListener(map, 'dragend', load_edges_callback);
        google.maps.event.addListener(map, 'resize', load_edges_callback);
        google.maps.event.addListener(map, 'zoom_changed', load_edges_callback);
        google.maps.event.addListener(map, 'click', $.proxy(function () {
          $("#elevation-chart-holder > .elevation-view-holder:first", $this.$el).trigger('elevation.hide')
        }, $this));

        google.maps.event.addListener(autocomplete, 'place_changed', function() {
          var place = autocomplete.getPlace();
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
          }
        });
      }, 200);
    },
    on_routes_loading_start: function() {
      this.$el.addClass('loading');
    },
    on_routes_loading_finished: function() {
      this.$el.removeClass('loading');
    },
    render           :function () {
      if (!this.is_initialized()) {
        var $this = this;
        console.log('waiting for required objects...');
        return setTimeout($.proxy($this.render, $this), 300);
      }
    },
    render_routes    :function () {
      this.routes_view.render();
    },
    // checks if map is initialized
    is_initialized   :function () {
      return typeof map != 'undefined' && $('body').is('.visualization-loaded');
    },
    // resizes map
    resize_map_holder:function () {
      var h = $(window).height() - this.$el.offset().top - $('#root-footer').height();
      $("#map", this.$el).height(h);
      if (map) google.maps.event.trigger(map, 'resize');
    }
  });

  var ElevationChartView = Backbone.View.extend({
    // model is PolylineModel
    template            :_.template($('#elevation-chart-template').html()),
    elevation_data      :{
      normal :null,
      reverse:null
    },
    initialize: function() {
      this.$el.addClass('elevation-view-holder');
    },
    chart_image_holder: null,
    elevation_service   :new google.maps.ElevationService(),
    events              :{
      "change #use-reverse-direction"              :"on_change_direction",
      "image-loading #elevation-chart-image-holder":"onbefore_imageload",
      "image-loaded #elevation-chart-image-holder" :"onafter_imageload",
      "elevation.hide"                             :"on_elevation_hide",
      "elevation.show"                             :"on_elevation_show"
    },
    render              :function () {
      var $this = this;
      $this.$el.html(this.template({
        color:$this.model.get('polyline').strokeColor,
        model:this.model.get('route_model').get('details').toJSON()
      }));

      this.chart_image_holder = $('#elevation-chart-image-holder', this.$el);
      $("#use-reverse-direction", this.$el).trigger('change');

      return this.$el;
    },
    on_change_direction :function () {
      var $checkbox = $("#use-reverse-direction", this.$el);
      ($checkbox.is(':checked')) ? this.use_reverse_data() : this.use_normal_data();
    },
    on_elevation_hide: function() {
      this.$el.slideUp();
    },
    on_elevation_show: function() {
      this.$el.slideDown();
    },
    use_normal_data     :function () {
      $('[data-initial]', this.$el).each(function () {
        var $e = $(this);
        $e.text($e.attr('data-initial'));
      });

      if (!this.elevation_data.normal) {
        this.chart_image_holder.trigger('image-loading');
        return this.elevation_service.getElevationAlongPath({ path:this.model.get('polyline').getPath().getArray(), samples: 100}, $.proxy(this.plot_elevation_graph, this));
      }

      return this.chart_image_holder.trigger('image-loaded', this.elevation_data.normal);
    },
    use_reverse_data    :function () {
      $('[data-reverse]', this.$el).each(function () {
        var $e = $(this);
        $e.text($e.attr('data-reverse'));
      });

      if (!this.elevation_data.reverse) {
        this.chart_image_holder.trigger('image-loading');
        return this.elevation_service.getElevationAlongPath({ path:this.model.get('polyline').getPath().getArray().reverse(), samples:100}, $.proxy(this.plot_elevation_graph, this));
      }

      return this.chart_image_holder.trigger('image-loaded', this.elevation_data.reverse);
    },
    onbefore_imageload  :function () {
      this.chart_image_holder.empty().addClass('loading').text('loading elevations data ...');
    },
    onafter_imageload   :function () {
      this.chart_image_holder.empty().removeClass('loading');
    },
    plot_elevation_graph:function (data, status) {
      if (status != google.maps.ElevationStatus.OK) return this.chart_image_holder.trigger('image-error');

      this.chart_image_holder.trigger('image-loaded');

      var elevation_chart_place = $('<div id="elevation-chart-image"/>').appendTo(this.chart_image_holder);

      var chart_object = new google.visualization.ColumnChart(elevation_chart_place.get(0));
      var chart_data = new google.visualization.DataTable();
      chart_data.addColumn('string', 'Sample');
      chart_data.addColumn('number', 'Elevation');

      _.map(data, function (result) {
        chart_data.addRow(['', result.elevation]);
      });

      chart_object.draw(chart_data, {
        width :elevation_chart_place.width(),
        height:elevation_chart_place.height(),
        legend:'none',
        titleY:'Elevation (m)'
      });
    }
  });

  var RoutesView = Backbone.View.extend({
    routes_collection   :null,
    details_index       :0,
    initialize          :function () {
      console.log('initialize routes view');
      this.routes_collection = new RoutesCollection();
      var $this = this;
      $(document).on('show_layer', $.proxy($this.show, $this));
    },
    /**
     * Renders edges on the map
     */
    render              :function () {
      var $this = this;
      if (!map) {
        console.error('Google Map is not defined yet');
        return false;
      }

      $this.update_detail_index();
      $this.update_collection();

      var rendered_routes_detail = rendered_routes[$this.details_index];
      var unrendered_ids = _.difference(
        $this.routes_collection.pluck('id'),
        rendered_routes_detail.pluck('id')
      );

      // add missing routes into polylines collection
      _.each(unrendered_ids, function (id) {
        var polyline_model = new PolylineModel({route_model:$this.routes_collection.get(id)});
        rendered_routes_detail.add(polyline_model);

        // attach polyline events
        google.maps.event.addListener(polyline_model.get('polyline'), 'click', $.proxy($this.polyline_onclick, $this, polyline_model));
        google.maps.event.addListener(polyline_model.get('polyline'), 'mouseover', $.proxy($this.polyline_onmouseover, $this, polyline_model));
        google.maps.event.addListener(polyline_model.get('polyline'), 'mouseout', $.proxy($this.polyline_onmouseout, $this, polyline_model));
      });

      $this.show();
    },
    update_collection   :function () {
      if (!map.getBounds()) return setTimeout($.proxy(this.update_collection, this), 500);
      var detail_value = this.details_index;
      var $this = this;
      $.ajax({
        url        :get_api_url('point'),
        crossDomain:true,
        dataType   :'json',
        async      :false,
        data       :{
          bounds:map.getBounds().toUrlValue(),
          detail:detail_value,
          limit :20000
        },
        success    :function (json) {
          var edges = json.edge;
          $this.routes_collection = loaded_routes[$this.details_index];
          var existing_ids = $this.routes_collection.pluck('id');

          // walk through received data and add new routes
          for (var id in edges) {
            if (_.indexOf(existing_ids, id) > -1) continue; // the route already exists, skip
            $this.routes_collection.add(new RouteModel({ id:id, points_raw:edges[id]}));
          }
        }
      })
    },
    /**
     * Shows routes on the map
     */
    show                :function (e, index) {
      var details_index = index || this.details_index;
      console.log('show index: ', details_index);
      for (var i in rendered_routes) {
        rendered_routes[i].setMap(i == details_index ? map : null);
      }
    },
    /**
     * Gets detail level based on current map zoom
     * @return {Number}
     */
    update_detail_index :function () {
      if (!map) return 0;
      var zoom_level = map.getZoom();
      var result;
      if (zoom_level > 15) {
        result = 0;
      }
      else if (zoom_level > 12) {
        result = 50;
      }
      else if (zoom_level > 11) {
        result = 150;
      }
      else if (zoom_level > 9) {
        result = 450;
      }
      else {
        result = 1350;
      }

      this.details_index = result;
      return result;
    },
    polyline_onclick    :function (polyline_model) {
      $("#elevation-chart-holder")
        .empty()
        .append(new ElevationChartView({ model:polyline_model }).render().trigger('elevation.show'))
    },
    polyline_onmouseover:function (polyline_model) {
      polyline_model.get('polyline').setOptions({strokeOpacity:1});
    },
    polyline_onmouseout :function (polyline_model) {
      polyline_model.get('polyline').setOptions({strokeOpacity:.7});
    }
  });


  var AppController = Backbone.Router.extend({
    routes :{
      "":'general'
    },
    general:function () {
      return new MapView().init().render();
    }
  });

  var map;
  var loaded_routes = {0:new RoutesCollection(), 50:new RoutesCollection(), 150:new RoutesCollection(), 450:new RoutesCollection(), 1350:new RoutesCollection() };
  var rendered_routes = {0:new PolylinesCollection(), 50:new PolylinesCollection(), 150:new PolylinesCollection(), 450:new PolylinesCollection(), 1350:new PolylinesCollection() };
  var app = new AppController();

  get_api_url = function (point) {
    return "http://stiglede.eu01.aws.af.cm/api/" + point;
  };
  Backbone.history.start();
})
;