var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');

module.exports = ContentView.extend({
    template: templates.includes.piechart,

    cleanup: function () {
        if (this._crossfilter) {
            this._crossfilter.dimension.filterAll();
            this._crossfilter.dimension.dispose();
            delete this._crossfilter.dimension;
        }
    },

    renderContent: function() {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a facet defined
        if(! this.model.primary) {
            return;
        }
        if(this._crossfilter) {
            this.cleanup();
        }
        if(this.model.secondary && this.model.secondary.displayContinuous) {
            this._crossfilter = util.dxGlue1d(this.model.primary,this.model.secondary);
        }
        else {
            this._crossfilter = util.dxGlue1d(this.model.primary,null);
        }

        // tear down existing stuff
        delete this._chart;

        var chart = dc.pieChart(this.queryByHook('piechart'));
        var that = this; // used in callback
        chart
            .transitionDuration(app.me.anim_speed)
            .dimension(this._crossfilter.dimension)
            .slicesCap(36)
            .group(this._crossfilter.group)
            .valueAccessor(this._crossfilter.valueAccessor)
            .on('filtered', function(chart) {
                if (chart.hasFilter()) {
                    that.model.selection = chart.filters();
                }
            });

        if(this.model.selection) {
            chart.filter([this.model.selection]);
        }

        chart.render();
        this._chart = chart;
    },
});
