import {spy} from 'sinon';
import test from 'ava';
import Interactor from '.';

test('run interactor', async t => {
	class Test extends Interactor {
		run() {}
	}

	spy(Test.prototype, 'run');

	await Test.run();

	t.true(Test.prototype.run.calledOnce);
});

test('run with context', async t => {
	class Test extends Interactor {
		run(context) {
			t.deepEqual(this.context, {a: 1});
			t.deepEqual(context, {a: 1});
		}
	}

	spy(Test.prototype, 'run');

	const context = await Test.run({a: 1});

	t.true(Test.prototype.run.calledOnce);
	t.deepEqual(context, {a: 1});
});

test('rollback', async t => {
	class Test extends Interactor {
		run() {
			throw new Error('Oops');
		}

		rollback() {}
	}

	spy(Test.prototype, 'run');
	spy(Test.prototype, 'rollback');

	await t.throws(Test.run(), 'Oops');
	t.true(Test.prototype.run.calledOnce);
	t.true(Test.prototype.rollback.calledOnce);
});

test('bundle other interactors', async t => {
	const arr = [];

	class First extends Interactor {
		run(context) {
			arr.push('first');

			context.first = true;
		}
	}

	class Second extends Interactor {
		run(context) {
			arr.push('second');

			context.second = true;
		}
	}

	class Bundle extends Interactor {
		organize() {
			return [First, Second];
		}
	}

	const context = await Bundle.run();
	t.deepEqual(arr, ['first', 'second']);
	t.deepEqual(context, {first: true, second: true});
});

test('rollback bundled interactors', async t => {
	const arr = [];

	class First extends Interactor {
		run() {
			arr.push('first');
		}

		rollback() {
			arr.push('rollback:first');
		}
	}

	class Second extends Interactor {
		run() {
			arr.push('second');
		}

		rollback() {
			arr.push('rollback:second');
		}
	}

	class Third extends Interactor {
		run() {
			arr.push('third');

			throw new Error('Oops');
		}

		rollback() {
			arr.push('rollback:third');
		}
	}

	class Fourth extends Interactor {
		run() {
			arr.push('fourth');
		}

		rollback() {
			arr.push('rollback:fourth');
		}
	}

	class Bundle extends Interactor {
		organize() {
			return [First, Second, Third, Fourth];
		}
	}

	await t.throws(Bundle.run(), 'Oops');

	t.deepEqual(arr, [
		'first',
		'second',
		'third',
		'rollback:third',
		'rollback:second',
		'rollback:first'
	]);
});
