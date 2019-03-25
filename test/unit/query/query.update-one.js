var assert = require('assert');
var Waterline = require('../../../lib/waterline');

describe('Collection Query ::', function() {
  describe('.updateOne()', function() {
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
            updatedAt: {
              type: 'number',
              autoUpdatedAt: true
            }
          }
        });

        waterline.registerModel(Model);

        // Fixture Adapter Def
        var adapterDef = { update: function(con, query, cb) { query.valuesToSet.id = 1; return cb(null, [query.valuesToSet]); }};

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
        query.updateOne({ id:undefined }, { name: 'foo' }, function(err) {
          if (!err) {
            return done(new Error('No error thrown for bad WHERE clause.'));
          }

          assert.ok(err.message.includes('Passing undefined in WHERE clause'), err.message);

          return done();
        });
      });

      it('should throw for undefined values in WHERE clause using deferreds', function(done) {
        query.updateOne()
          .where({ id:undefined })
          .set({ name: 'foo' })
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
