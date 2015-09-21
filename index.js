'use strict';

/**
 * Dependencies
 */

var isFunction = require('is-function');
var isPromise = require('is-promise');
var Promise = require('bluebird');
var execute = require('exec-fn');
var clone = require('clone');


/**
 * Expose `interactor`
 */

module.exports = Interactor;


/**
 * Organize logic into interactors
 */

function Interactor (context) {
  this.context = context || {};
}


/**
 * Run an interactor and rollback on error
 *
 * @api private
 */

Interactor.prototype._run = function () {
  var self = this;

  // this is an interactor
  if (this.run) {
    return execute(this.run, this.context)
      .catch(function (err) {
        // error happened, rollback now
        return execute(self.rollback, self.context)
          .then(function () {
            // even if rollback went fine
            // error from run() should be returned
            return Promise.reject(err);
          });
      })
      .then(function () {
        // return interactor's context
        return self.context;
      });
  }

  // this is a bundle of interactors
  if (this.organize) {
    // get a list of sub-interactors
    var organize = execute(this.organize, this.context);

    // store succeeded interactors, so that
    // we can rollback them later, if needed
    var interactors = [];

    return Promise.resolve(organize)
      .each(function (Interactor, index) {
        // clone context, so each interactor
        // is truly independent
        var interactor = new Interactor(clone(self.context));

        return interactor._run()
          .then(function (context) {
            // interactor succeeded
            // save its context
            self.context = context;

            interactors.push(interactor);
          })
          .catch(function (err) {
            // interactor failed
            // now, rollback succeeded interactors
            // in a reversed order
            interactors.reverse();

            return Promise.resolve(interactors)
              .each(function (interactor) {
                return execute(interactor.rollback, interactor.context);
              })
              .then(function () {
                // return initial error
                return Promise.reject(err);
              });
          });
      })
      .then(function () {
        // return final context
        return self.context;
      });
  }
};


/**
 * Empty rollback function, in case user does not set one
 */

Interactor.prototype.rollback = function () {};


/**
 * Run this interactor
 *
 * @param {Object} context
 * @return {Promise}
 * @api public
 */

Interactor.run = function (context) {
  var interactor = new this(context);
  return interactor._run();
};
