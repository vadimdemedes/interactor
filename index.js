'use strict';

const pEachSeries = require('p-each-series');
const pTry = require('p-try');

const exec = (context, method, arg) => pTry(() => context[method].call(context, arg)); // eslint-disable-line no-useless-call

class Interactor {
	constructor(context) {
		this.context = context || {};
	}

	rollback() {}

	_run() {
		if (this.run) {
			return this._runInteractor();
		} else if (this.organize) {
			return this._organizeInteractors();
		}
	}

	_runInteractor() {
		return exec(this, 'run', this.context)
			.catch(err => {
				return exec(this, 'rollback', this.context).then(() => Promise.reject(err));
			})
			.then(() => this.context);
	}

	_organizeInteractors() {
		const passedInteractors = [];

		return exec(this, 'organize', this.context)
			.then(interactors => {
				return pEachSeries(interactors, SubInteractor => {
					const interactor = new SubInteractor(Object.assign({}, this.context));

					return interactor._run()
						.then(context => {
							this.context = context;

							passedInteractors.push(interactor);
						})
						.catch(err => {
							passedInteractors.reverse();

							return pEachSeries(passedInteractors, interactor => {
								return exec(interactor, 'rollback', interactor.context);
							}).then(() => Promise.reject(err));
						});
				});
			})
			.then(() => this.context);
	}
}

Interactor.run = function (context) {
	return new this(context)._run();
};

module.exports = Interactor;
