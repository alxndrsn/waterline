var assert = require('assert');
var Waterline = require('../../../lib/waterline');

describe('Collection Query ::', function() {
  describe('.destroyOne()', function() {
    describe('with proper values', function() {
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
            },
            age: {
              type: 'number'
            },
            destroydAt: {
              type: 'number',
              autoUpdatedAt: true
            }
          }
        });

        waterline.registerModel(Model);

        // Fixture Adapter Def
        var adapterDef = { destroy: function(con, query, cb) { query.valuesToSet.id = 1; return cb(null, [query.valuesToSet]); }};

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

      it('should throw for undefined values in WHERE clause using callbacks', function(done) {
        query.destroyOne({ id:undefined }, function(err) {
          if (!err) {
            return done(new Error('No error thrown for bad WHERE clause.'));
          }

          assert.ok(err.message.includes('Passing undefined in WHERE clause'), err.message);

          return done();
        });
      });

      it('should throw for undefined values in WHERE clause using deferreds', function(done) {
        query.destroyOne()
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
  });
});
