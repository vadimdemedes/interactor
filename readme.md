<h1 align="center">
  <br>
  <img width="200" src="media/logo.png">
  <br>
  <br>
  <br>
</h1>

[![Build Status](https://travis-ci.org/vadimdemedes/interactor.svg?branch=master)](https://travis-ci.org/vadimdemedes/interactor)

Organize logic into separate, easily-testable modules.
Inspired by Ruby's [interactor](https://github.com/collectiveidea/interactor) gem.


## What is interactor?

Interactor is a module, that does only one thing and does it well.
Each interactor represents a single thing your application does.
For example, `AddComment`, `OrderProduct` or `AuthenticateUser`.


## Why interactors?

Why would you want to basically move your code to interactor?

1. Interactor can be easily tested, because it does only one thing
2. When your app uses interactors and you need introduce changes, you make them only in one place
3. Interactors can rollback in case of an error
4. Models become less bloated of before/after hooks
5. Interactors can organize other interactors (see later why it's useful)


## Installation

```
$ npm install --save interactor
```


## Usage

For example, take a look how to use an `SaveComment` interactor to add new comment:

```js
const Interactor = require('interactor');

class SaveComment extends Interactor {
  async run(context) {
    const comment = new Comment();

    comment.post_id = context.post.id;
    comment.author = context.comment.author;
    comment.body = context.comment.body;

    await comment.save();
  }

	async rollback() {
		// rollback in case of an error thrown in run()
	}
}

const post = {
  id: 1,
  title: 'Great post'
};

const comment = {
  author: 'Vadim',
  body: 'My God, interactors are amazing'
};

await SaveComment.run({post, comment});
```

Now, let's say we want to send a push notification, after a comment was saved.
With interactors it is easy, you just create a new interactor and bundle them together.


```js
class SendCommentNotification extends Interactor {
  async run (context) {
    const notification = new Notification();

    notification.message = 'New comment was posted in post ' + this.post.title;
    notification.post_id = context.post.id;

		await notification.save();
  }
}

class AddComment extends Interactor {
  organize () {
    return [SaveComment, SendCommentNotification];
  }
}

await AddComment.run({post, comment});
```

It's like LEGO blocks, you just compose pieces of logic and get a complete feature at the end.
Like in the above example, comment is saved to a database via `SaveComment` interactor and then
a notification is sent via `SendCommentNotification` interactor. And there is `AddComment`, that composes both of these
together to perform one single task.

And the great part is - these pieces can be easily testable, because they do not directly depend on each other.



### Running an interactor

You should put your code into `run()` method of your interactor class.
This function can be a "regular" function, async function or function that returns a `Promise`:

```js
class SaveComment extends Interactor {
  run () {
    // regular function
  }
}

class SaveComment extends Interactor {
  run () {
    // returns promise
    return Promise.resolve();
  }
}

class SaveComment extends Interactor {
	async run () {
		// returns promise
	}
}
```


### Rollback an interactor

If error happens during `run()` or a returned promise is rejected, you can use `rollback()` method to rollback possible changes you did in `run()`:

```js
class SaveComment extends Interactor {
  async run () {
    const comment = new Comment();

    await comment.save();
  }

  async rollback () {
    // error happened
    // need to rollback
  }
}
```

`rollback()` function can also be a normal function or a function that returns a `Promise`, just like `run()`.


### Bundle interactors

The true power of interactors comes clear when you bundle them (like in the example with comments above).
To **serially** run interactors, define `organize()` method that returns an array of `Interactor` classes in an order which you want them to run.

When interactor fails, previous interactors (including a failed one) will be rolled back and next interactors won't run at all.

Interactor with `organize()` can be executed just like a regular one:

```js
class AddComment extends Interactor {
  organize () {
    return [AddComment, SendCommentNotification];
  }
}

await AddComment.run();
```


## License

MIT © [Vadim Demedes](https://github.com/vadimdemedes)
