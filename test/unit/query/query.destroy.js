var assert = require('assert');
var Waterline = require('../../../lib/waterline');

describe('Collection Query ::', function() {
  describe('.destroy()', function() {

    describe('with Auto PK', function() {
      var query;

      before(function(done) {
        var waterline = new Waterline();
        var Model = Waterline.Model.extend({
          identity: 'user',
          datastore: 'foo',
          primaryKey: 'id',
          attributes: {
            id: {
              type: 'number'
            },
            name: {
              type: 'string',
              defaultsTo: 'Foo Bar'
            }
          }
        });

        waterline.registerModel(Model);

        // Fixture Adapter Def
        var adapterDef = { destroy: function(con, query, cb) { return cb(); }};

        var connections = {
          'foo': {
            adapter: 'foobar'
          }
        };

        waterline.initialize({ adapters: { foobar: adapterDef }, datastores: connections }, function(err, orm) {
          if (err) {
            return done(err);
          }
          query = orm.collections.user;
          return done();
        });
      });

      it('should not return an error', function(done) {
        query.destroy({}, function(err) {
          if (err) {
            return done(err);
          }

          return done();
        });
      });

      it('should allow a query to be built using deferreds', function(done) {
        query.destroy()
        .where({})
        .exec(function(err) {
          if (err) {
            return done(err);
          }

          return done();
        });
      });

      it('should throw for undefined primary key using callbacks', function(done) {
        query.destroy(undefined, function(err) {
          if (!err) {
            return done(new Error('No error thrown for undefined primary key.'));
          }

          assert.ok(err.message.includes('Cannot use this method (`destroy`) with a criteria of `undefined`.'), err.message);

          return done();
        });
      });

      it('should throw for undefined values in WHERE clause using callbacks', function(done) {
        query.destroy({ id:undefined }, function(err) {
          if (!err) {
            return done(new Error('No error thrown for bad WHERE clause.'));
          }

          assert.ok(err.message.includes('Passing undefined in WHERE clause'), err.message);

          return done();
        });
      });

      it('should throw for undefined values in WHERE clause using deferreds', function(done) {
        query.destroy()
          .where({ id:undefined })
          .exec(function(err) {
            if (!err) {
              return done(new Error('No error thrown for bad WHERE clause.'));
            }

            assert.ok(err.message.includes('Passing undefined in WHERE clause'), err.message);

            return done();
          });
      });
    });

    describe('with custom columnName set', function() {
      var query;

      before(function(done) {
        var waterline = new Waterline();

        // Extend for testing purposes
        var Model = Waterline.Model.extend({
          identity: 'user',
          datastore: 'foo',
          primaryKey: 'myPk',
          attributes: {
            name: {
              type: 'string',
              defaultsTo: 'Foo Bar'
            },
            myPk: {
              type: 'number',
              columnName: 'pkColumn'
            }
          }
        });

        waterline.registerModel(Model);

        // Fixture Adapter Def
        var adapterDef = { destroy: function(con, query, cb) { return cb(null, query.criteria); }};

        var connections = {
          'foo': {
            adapter: 'foobar'
          }
        };

        waterline.initialize({ adapters: { foobar: adapterDef }, datastores: connections }, function(err, orm) {
          if (err) {
            return done(err);
          }
          query = orm.collections.user;
          return done();
        });
      });


      it('should use the custom primary key when a single value is passed in', function(done) {
        query.destroy(1, function(err) {
          if (err) {
            return done(err);
          }
          return done();
        });
      });
    });
  });
});
