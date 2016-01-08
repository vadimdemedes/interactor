'use strict';

/**
 * Dependencies
 */

const Interactor = require('./');
const test = require('ava');


/**
 * Tests
 */

test('run interactor', async t => {
	t.plan(1);

	class Test extends Interactor {
		run () {
			t.pass();
		}
	}

	await Test.run();
});

test('run with context', async t => {
	t.plan(1);

	let context = {
		a: 1
	};

	class Test extends Interactor {
		run () {
			t.is(this.a, 1);
		}
	}

	await Test.run(context);
});

test('run and return context', async t => {
	t.plan(1);

	class Test extends Interactor {
		run () {
			this.value = true;
		}
	}

	let context = await Test.run();
	t.true(context.value);
});

test('rollback', async t => {
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

	await Test.run()
		.catch(() => {
			t.pass();
		});
});

test('bundle other interactors', async t => {
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

	let context = await Bundle.run();
	t.same(arr, ['first', 'second']);
	t.true(context.first);
	t.true(context.second);
});

test('rollback bundled interactors', async t => {
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

	try {
		await Bundle.run();
	} catch (err) {
		t.is(err.message, 'Fatal');
		t.same(arr, [
			'first',
			'second',
			'third',
			'rollback:third',
			'rollback:second',
			'rollback:first'
		]);
	}
});
