'use strict';

/**
 * Dependencies
 */

const Interactor = require('./');
const test = require('ava');


/**
 * Tests
 */

test('run interactor', function (t) {
	t.plan(1);

	class Test extends Interactor {
		run () {
			t.pass();
		}
	}

	Test.run();
});

test('run with context', function (t) {
	t.plan(1);

	let context = {
		a: 1
	};

	class Test extends Interactor {
		run () {
			t.is(this.a, 1);
		}
	}

	Test.run(context);
});

test('run and return context', function (t) {
	// t.plan(1);

	class Test extends Interactor {
		run () {
			this.value = true;
		}
	}

	return Test.run().then(function (context) {
		t.true(context.value);
	});
});

test('rollback', function (t) {
	t.plan(3);

	class Test extends Interactor {
		run () {
			t.pass();

			throw new Error();
		}

		rollback () {
			t.pass();
		}
	}

	Test.run().catch(function () {
		t.pass();
	});
});

test('bundle other interactors', function (t) {
	t.plan(3);

	let arr = [];

	class First extends Interactor {
		run () {
			arr.push('first');

			this.first = true;
		}
	}

	class Second extends Interactor {
		run () {
			arr.push('second');

			this.second = true;
		}
	}

	class Bundle extends Interactor {
		organize () {
			return [First, Second];
		}
	}

	Bundle.run().then(function (context) {
		t.same(arr, ['first', 'second']);
		t.true(context.first);
		t.true(context.second);
	});
});

test('rollback bundled interactors', function (t) {
	t.plan(2);

	let arr = [];

	class First extends Interactor {
		run () {
			arr.push('first');
		}

		rollback () {
			arr.push('rollback:first');
		}
	}

	class Second extends Interactor {
		run () {
			arr.push('second');
		}

		rollback () {
			arr.push('rollback:second');
		}
	}

	class Third extends Interactor {
		run () {
			arr.push('third');

			throw new Error('Fatal');
		}

		rollback () {
			arr.push('rollback:third');
		}
	}

	class Fourth extends Interactor {
		run () {
			arr.push('fourth');
		}

		rollback () {
			arr.push('rollback:fourth');
		}
	}

	class Bundle extends Interactor {
		organize () {
			return [First, Second, Third, Fourth];
		}
	}

	Bundle.run().catch(function (err) {
		t.is(err.message, 'Fatal');
		t.same(arr, [
			'first',
			'second',
			'third',
			'rollback:third',
			'rollback:second',
			'rollback:first'
		]);
	});
});
