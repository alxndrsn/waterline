/**
 * Module Dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var parley = require('parley');
var buildOmen = require('../utils/query/build-omen');
var forgeStageTwoQuery = require('../utils/query/forge-stage-two-query');
var getQueryModifierMethods = require('../utils/query/get-query-modifier-methods');
var verifyModelMethodContext = require('../utils/query/verify-model-method-context');


/**
 * Module constants
 */

var DEFERRED_METHODS = getQueryModifierMethods('archive');



/**
 * archive()
 *
 * Archive (s.k.a. "soft-delete") records that match the specified criteria,
 * saving them as new records in the built-in Archive model, then destroying
 * the originals.
 *
 * ```
 * // Archive all bank accounts with more than $32,000 in them.
 * BankAccount.archive().where({
 *   balance: { '>': 32000 }
 * }).exec(function(err) {
 *   // ...
 * });
 * ```
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * Usage without deferred object:
 * ================================================
 *
 * @param {Dictionary?} criteria
 *
 * @param {Function?} explicitCbMaybe
 *        Callback function to run when query has either finished successfully or errored.
 *        (If unspecified, will return a Deferred object instead of actually doing anything.)
 *
 * @param {Ref?} meta
 *     For internal use.
 *
 * @returns {Ref?} Deferred object if no `explicitCbMaybe` callback was provided
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * The underlying query keys:
 * ==============================
 *
 * @qkey {Dictionary?} criteria
 *
 * @qkey {Dictionary?} meta
 * @qkey {String} using
 * @qkey {String} method
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function archive(/* criteria, explicitCbMaybe, metaContainer */) {

  // Verify `this` refers to an actual Sails/Waterline model.
  verifyModelMethodContext(this);

  // Set up a few, common local vars for convenience / familiarity.
  var WLModel = this;
  var orm = this.waterline;
  var modelIdentity = this.identity;

  // Build an omen for potential use in the asynchronous callback below.
  var omen = buildOmen(archive);

  // Build initial query.
  var query = {
    method: 'archive',
    using: modelIdentity,
    criteria: undefined,
    meta: undefined
  };

  //  ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗ ██████╗███████╗
  //  ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║██╔════╝██╔════╝
  //  ██║   ██║███████║██████╔╝██║███████║██║  ██║██║██║     ███████╗
  //  ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██║  ██║██║██║     ╚════██║
  //   ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝██║╚██████╗███████║
  //    ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝ ╚═════╝╚══════╝
  //
  // FUTURE: when time allows, update this to match the "VARIADICS" format
  // used in the other model methods.

  // The explicit callback, if one was provided.
  var explicitCbMaybe;

  // Handle double meaning of first argument:
  //
  // • archive(criteria, ...)
  if (!_.isFunction(arguments[0])) {
    query.criteria = arguments[0];
    explicitCbMaybe = arguments[1];
    query.meta = arguments[2];
  }
  // • archive(explicitCbMaybe, ...)
  else {
    explicitCbMaybe = arguments[0];
    query.meta = arguments[1];
  }



  //  ██████╗ ███████╗███████╗███████╗██████╗
  //  ██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗
  //  ██║  ██║█████╗  █████╗  █████╗  ██████╔╝
  //  ██║  ██║██╔══╝  ██╔══╝  ██╔══╝  ██╔══██╗
  //  ██████╔╝███████╗██║     ███████╗██║  ██║
  //  ╚═════╝ ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝
  //
  //   ██╗███╗   ███╗ █████╗ ██╗   ██╗██████╗ ███████╗██╗
  //  ██╔╝████╗ ████║██╔══██╗╚██╗ ██╔╝██╔══██╗██╔════╝╚██╗
  //  ██║ ██╔████╔██║███████║ ╚████╔╝ ██████╔╝█████╗   ██║
  //  ██║ ██║╚██╔╝██║██╔══██║  ╚██╔╝  ██╔══██╗██╔══╝   ██║
  //  ╚██╗██║ ╚═╝ ██║██║  ██║   ██║   ██████╔╝███████╗██╔╝
  //   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝
  //
  //  ┌┐ ┬ ┬┬┬  ┌┬┐   ┬   ┬─┐┌─┐┌┬┐┬ ┬┬─┐┌┐┌  ┌┐┌┌─┐┬ ┬  ┌┬┐┌─┐┌─┐┌─┐┬─┐┬─┐┌─┐┌┬┐
  //  ├┴┐│ │││   ││  ┌┼─  ├┬┘├┤  │ │ │├┬┘│││  │││├┤ │││   ││├┤ ├┤ ├┤ ├┬┘├┬┘├┤  ││
  //  └─┘└─┘┴┴─┘─┴┘  └┘   ┴└─└─┘ ┴ └─┘┴└─┘└┘  ┘└┘└─┘└┴┘  ─┴┘└─┘└  └─┘┴└─┴└─└─┘─┴┘
  //  ┌─    ┬┌─┐  ┬─┐┌─┐┬  ┌─┐┬  ┬┌─┐┌┐┌┌┬┐    ─┐
  //  │───  │├┤   ├┬┘├┤ │  ├┤ └┐┌┘├─┤│││ │   ───│
  //  └─    ┴└    ┴└─└─┘┴─┘└─┘ └┘ ┴ ┴┘└┘ ┴     ─┘
  // If a callback function was not specified, then build a new Deferred and bail now.
  //
  // > This method will be called AGAIN automatically when the Deferred is executed.
  // > and next time, it'll have a callback.
  return parley(

    function (done){

      // Otherwise, IWMIH, we know that a callback was specified.
      // So...

      //  ███████╗██╗  ██╗███████╗ ██████╗██╗   ██╗████████╗███████╗
      //  ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║   ██║╚══██╔══╝██╔════╝
      //  █████╗   ╚███╔╝ █████╗  ██║     ██║   ██║   ██║   █████╗
      //  ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║   ██║   ██║   ██╔══╝
      //  ███████╗██╔╝ ██╗███████╗╚██████╗╚██████╔╝   ██║   ███████╗
      //  ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝
      //
      //  ╔═╗╔═╗╦═╗╔═╗╔═╗  ┌─┐┌┬┐┌─┐┌─┐┌─┐  ┌┬┐┬ ┬┌─┐  ┌─┐ ┬ ┬┌─┐┬─┐┬ ┬
      //  ╠╣ ║ ║╠╦╝║ ╦║╣   └─┐ │ ├─┤│ ┬├┤    │ ││││ │  │─┼┐│ │├┤ ├┬┘└┬┘
      //  ╚  ╚═╝╩╚═╚═╝╚═╝  └─┘ ┴ ┴ ┴└─┘└─┘   ┴ └┴┘└─┘  └─┘└└─┘└─┘┴└─ ┴
      //
      // Forge a stage 2 query (aka logical protostatement)
      // This ensures a normalized format.
      try {
        forgeStageTwoQuery(query, orm);
      } catch (err) {
        switch (err.code) {
          case 'E_INVALID_CRITERIA':
            return done(
              flaverr({
                name: 'UsageError',
                message:
                'Invalid criteria.\n'+
                'Details:\n'+
                '  '+err.details+'\n'
              }, omen)
            );

          case 'E_NOOP':
            // Determine the appropriate no-op result.
            // If `fetch` meta key is set, use `[]`-- otherwise use `undefined`.
            var noopResult = undefined;
            if (query.meta && query.meta.fetch) {
              noopResult = [];
            }//>-
            return done(undefined, noopResult);

          default:
            return done(err);
        }
      }//ﬁ

      // Bail now if archival has been disabled.
      if (!WLModel.Archive) {
        return done(flaverr({
          name: 'UsageError',
          message: 'Since the `Archive` setting was explicitly disabled, .archive() cannot be used.'
        }, omen));
      }//•

      // Look up the Archive model.
      var Archive = WLModel.Archive;
      if (Archive.identity && Archive.identity !== '_archive') {
        return done(new Error('Consistency violation: Cannot override the `identity` of the built-in Archive model!  (expecting "_archive", but instead got "'+Archive.identity+'")'));
      }

      try {
        Archive = getModel('_archive', orm);
      }
      catch (err) {
        switch (err.code) {
          case 'E_MODEL_NOT_REGISTERED':
            return done(new Error('Since the `Archive` setting was explicitly disabled, .archive() '));
          // TODO: check to see if this was deliberately disabled
            return done(err);
          default: return done(err);
        }
      }//ﬁ

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // TODO: provide a way of choosing which datastore is "dominant"
      // as far as the Archive model is concerned (e.g. where does it live).
      // {
      //   …(in top-level orm settings)…
      //   Archive: { datastore: 'foo' }
      // }
      //
      // TODO: provide a way of choosing the `tableName` and `columnName`s
      // for the Archive model
      // {
      //   …(in top-level orm settings)…
      //   Archive: {
      //     tableName: 'foo',
      //     attributes: {
      //       originalRecord: { type: 'json', columnName: 'barbaz' },
      //       fromModel: { type: 'string', columnName: 'bingbong' }
      //     }
      //   }
      // }
      //
      // TODO: provide a way of disabling the Archive model (and thus
      // disabling support for the `.archive()` model method)
      // {
      //   …(in top-level orm settings)…
      //   Archive: false
      // }
      //
      // TODO: prevent overriding the Archive model's `identity`, which
      // is immutable & private, for simplicity's sake
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // TODO: automigrate the built-in Archive model
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // TODO: inject the built-in Archive model into the ORM's ontology
      //   • id              (pk-- string or number, depending on where the Archive model is being stored)
      //   • createdAt       (timestamp-- this is effectively ≈ "archivedAt")
      //   • originalRecord  (json-- the original record, completely unpopulated)
      //   • fromModel       (string-- the original model identity)
      //
      //  > Note there's no updatedAt!
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


      // - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: pass through the `omen` in the metadata.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - -

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Maybe refactor this into more-generic `.move()` and/or
      // `.copy()` methods for migrating data between models/datastores.
      // Then just leverage those methods here in `.archive()`.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


      //  ╔═╗═╗ ╦╔═╗╔═╗╦ ╦╔╦╗╔═╗  ┌─┐┬┌┐┌┌┬┐  ┌─┐ ┬ ┬┌─┐┬─┐┬ ┬
      //  ║╣ ╔╩╦╝║╣ ║  ║ ║ ║ ║╣   ├┤ ││││ ││  │─┼┐│ │├┤ ├┬┘└┬┘
      //  ╚═╝╩ ╚═╚═╝╚═╝╚═╝ ╩ ╚═╝  └  ┴┘└┘─┴┘  └─┘└└─┘└─┘┴└─ ┴
      // Note that we pass in `meta` here, as well as in the other queries
      // below.  (This ensures we're on the same db connection, provided one
      // was explicitly passed in!)
      WLModel.find(query.criteria, function _afterFinding(err, foundRecords) {
        if (err) { return done(err); }

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: as an optimization, fetch records batch-at-a-time
        // using .stream() instead of just doing a naïve `.find()`.
        // (This would allow you to potentially archive millions of records
        // at a time without overflowing RAM.)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        var archives = [];
        _.each(foundRecords, function(record){
          archives.push({
            originalRecord: record,
            fromModel: WLModel.identity,
          });
        });//∞

        //  ╔═╗═╗ ╦╔═╗╔═╗╦ ╦╔╦╗╔═╗  ┌─┐┬─┐┌─┐┌─┐┌┬┐┌─┐┌─┐┌─┐┌─┐┬ ┬  ┌─┐ ┬ ┬┌─┐┬─┐┬ ┬
        //  ║╣ ╔╩╦╝║╣ ║  ║ ║ ║ ║╣   │  ├┬┘├┤ ├─┤ │ ├┤ ├┤ ├─┤│  ├─┤  │─┼┐│ │├┤ ├┬┘└┬┘
        //  ╚═╝╩ ╚═╚═╝╚═╝╚═╝ ╩ ╚═╝  └─┘┴└─└─┘┴ ┴ ┴ └─┘└─┘┴ ┴└─┘┴ ┴  └─┘└└─┘└─┘┴└─ ┴
        Archive.createEach(archives, function _afterCreatingEach(err) {
          if (err) { return done(err); }

          //  ╔═╗═╗ ╦╔═╗╔═╗╦ ╦╔╦╗╔═╗  ┌┬┐┌─┐┌─┐┌┬┐┬─┐┌─┐┬ ┬  ┌─┐ ┬ ┬┌─┐┬─┐┬ ┬
          //  ║╣ ╔╩╦╝║╣ ║  ║ ║ ║ ║╣    ││├┤ └─┐ │ ├┬┘│ │└┬┘  │─┼┐│ │├┤ ├┬┘└┬┘
          //  ╚═╝╩ ╚═╚═╝╚═╝╚═╝ ╩ ╚═╝  ─┴┘└─┘└─┘ ┴ ┴└─└─┘ ┴   └─┘└└─┘└─┘┴└─ ┴
          WLModel.destroy(query.criteria, function _afterDestroying(err) {
            if (err) { return done(err); }

            return done();

          }, query.meta);//</.destroy()>
        }, query.meta);//</.createEach()>
      }, query.meta);//</.find()>

    },


    explicitCbMaybe,


    _.extend(DEFERRED_METHODS, {

      // Provide access to this model for use in query modifier methods.
      _WLModel: WLModel,

      // Set up initial query metadata.
      _wlQueryInfo: query,

    })


  );//</parley>

};