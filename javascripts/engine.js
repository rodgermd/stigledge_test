$(function() {
  var MapView = new Backbone.View.extend({
    initialize: function() {

    },
    model: null,
    render: function() {

    }
  });

  var ControlsView = new Backbone.View.extend({

  });

  var RoutesListView = new Backbone.View.extend({

  });

  var ElevationChartView = new Backbone.View.extend({

  });




  var AppController = Backbone.Router.extend({
    routes: {
      "!" : 'general'
    },
    general: function() {
      return new MapView().render();
    }

  });
});