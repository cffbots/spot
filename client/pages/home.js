var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');

var CrossfilterDataset = require('../models/dataset-crossfilter');
var utildx = require('../util-crossfilter');
var SqlDataset = require('../models/dataset-sql');
var utilsql = require('../util-sql');

module.exports = PageView.extend({
  pageTitle: 'home',
  template: templates.pages.home,
  events: {
    'click [data-hook~=session-download]': 'downloadSession',
    'change [data-hook~=session-upload-input]': 'uploadSession',
    'change [data-hook~=json-upload-input]': 'uploadJSON',
    'change [data-hook~=csv-upload-input]': 'uploadCSV',
    'click [data-hook~=sql-connect]': 'connectSQL'
  },
  downloadSession: function () {
    var json = JSON.stringify(app.me.toJSON());
    var blob = new window.Blob([json], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var a = this.queryByHook('session-download');
    a.download = 'session.json';
    a.href = url;

  // FIXME: life cycle of the object url
  // var objectURL = window.URL.createObjectURL(fileObj)
  // window.URL.revokeObjectURL(objectURL)
  },
  uploadSession: function () {
    var fileLoader = this.queryByHook('session-upload-input');
    var uploadedFile = fileLoader.files[0];

    var reader = new window.FileReader();

    reader.onload = function (evt) {
      var data = JSON.parse(evt.target.result);
      app.me.set(data);
    };

    reader.onerror = function (evt) {
      console.error('Error', evt);
    };

    reader.readAsText(uploadedFile);
  },
  uploadJSON: function () {
    var fileLoader = this.queryByHook('json-upload-input');
    var uploadedFile = fileLoader.files[0];

    app.me.dataURL = fileLoader.files[0].name; // TODO: can we get an URI for a local file?
    app.me.dataset = new CrossfilterDataset();

    var reader = new window.FileReader();

    reader.onload = function (evt) {
      var json = JSON.parse(evt.target.result);

      // Tag the data with the dataURL
      json.forEach(function (d) {
        d.dataURL = app.me.dataURL;
      });
      utildx.crossfilter.add(json);
    };

    reader.onerror = function (evt) {
      console.error('Error loading session', evt);
    };

    reader.readAsText(uploadedFile);
  },
  uploadCSV: function () {
    var fileLoader = this.queryByHook('csv-upload-input');
    var uploadedFile = fileLoader.files[0];

    app.me.dataURL = fileLoader.files[0].name; // TODO: can we get an URI for a local file?
    app.me.dataset = new CrossfilterDataset();

    var reader = new window.FileReader();

    reader.onload = function (evt) {
      csv.parse(evt.target.result, function (err, data) {
        if (err) {
          console.warn(err.message);
        } else {
          // Tag the data with the dataURL
          var i;
          var j;
          var json = [];

          for (i = 0; i < data.length; i++) {
            var record = {};
            for (j = 0; j < data[i].length; j++) {
              record[j] = data[i][j];
            }
            record.dataURL = app.me.dataURL;
            json.push(record);
          }
          utildx.crossfilter.add(json);
        }
      });
    };

    reader.onerror = function (evt) {
      console.error('Error loading session', evt);
    };

    reader.readAsText(uploadedFile);
  },
  connectSQL: function () {
    app.me.dataset = new SqlDataset();
    utilsql.connect();
  }
});
