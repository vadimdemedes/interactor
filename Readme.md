# Interactor

[![Build Status](https://travis-ci.org/vdemedes/interactor.svg?branch=master)](https://travis-ci.org/vdemedes/interactor)
[![Coverage Status](https://coveralls.io/repos/vdemedes/interactor/badge.svg?branch=master&service=github)](https://coveralls.io/github/vdemedes/interactor?branch=master)

Organize logic into separate, easily-testable modules.
Basically a port of Ruby's [interactor](https://github.com/collectiveidea/interactor) gem.


<h1 align="center">
  <br>
  <img width="200" src="media/logo.png">
  <br>
  <br>
  <br>
</h1>


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
$ npm install interactor --save
```


## Usage

For example, take a look how to use an `SaveComment` interactor to add new comment:

```js
const Interactor = require('interactor');

class SaveComment extends Interactor {
  run () {
    let comment = new Comment(); // your model

    comment.post_id = this.post.id;
    comment.author = this.comment.author;
    comment.body = this.comment.body;

    return comment.save();
  }
}

let comment = {
  author: 'Vadim',
  body: 'My God, interactors are amazing'
};

let post = {
  id: 1,
  title: 'Great post'
};

let context = {
  comment: comment,
  post: post
};

SaveComment.run(context)
  .then(function () {
    // comment saved
  })
  .catch(function (err) {
    // error occurred
  });
```

Now, let's say we want to send a push notification, after a comment was saved.
With interactors it is easy, you just create a new interactor and bundle them together.


```js
class SendCommentNotification extends Interactor {
  run () {
    let notification = new Notification();

    notification.message = 'New comment was posted in post ' + this.post.title;
    notification.post_id = this.post.id;
  }
}

class AddComment extends Interactor {
  organize () {
    return [SaveComment, SendCommentNotification];
  }
}

AddComment.run(context)
  .then(function () {
    // comment saved
    // notification sent
  })
  .catch(function (err) {
    // error occurred
  });
```

It's like LEGO blocks, you just compose pieces of logic and get a complete feature at the end.
Like in the above example, comment is saved to a database via `SaveComment` interactor and then
a notification is sent via `SendCommentNotification` interactor. And there is `AddComment`, that composes both of these
together to perform one single task.

And the great part is - these pieces can be easily testable, because they do not directly depend on each other.



### Running an interactor

You should put your code into `run()` method of your interactor class.
This function can be a "regular" function, generator function or function that returns a `Promise`:

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
  * run () {
    // generator function
  }
}
```

All of them work equally the same.


### Rollback an interactor

If error happens during `run()` or a returned promise is rejected, you can use `rollback()` method
to rollback possible changes you did in `run()`:

```js
class SaveComment extends Interactor {
  run () {
    let comment = new Comment();

    return comment.save();
  }

  rollback () {
    // error happened
    // need to rollback
  }
}
```

`rollback()` function can also be a generator function or function that returns a `Promise`, just like `run()`.


### Bundle interactors

True power of interactors comes clear when you bundle them (like in the example with comments above).
To **serially** run interactors, define `organize()` method that returns an array of `Interactor` classes
in an order which you want them to run.

When interactor fails, previous interactors (including a failed one) will be rolled back and next interactors won't run at all.

Interactor with `organize()` can be executed just like a regular one:

```js
class AddComment extends Interactor {
  organize () {
    return [AddComment, SendCommentNotification];
  }
}

AddComment.run();
```


## Tests

```
$ npm test
```


## License

MIT © [Vadym Demedes](https://github.com/vdemedes)
