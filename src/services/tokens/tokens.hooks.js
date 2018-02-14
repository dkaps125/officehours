const { authenticate } = require('feathers-authentication').hooks;
const auth  = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const search = require('feathers-mongodb-fuzzy-search');
const errors = require('feathers-errors');
const xss = require('xss');

const MAX_DESC_LEN = 200;

const createdToken = hook => {
  console.log(hook);
}

const restrictToTAOrSelf =
// !!hooks.params.provider true when external
commonHooks.when(hook => !!hook.params.provider &&
  !!hook.params.user && !(hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  auth.restrictToOwner({ownerField: 'user'})
);

const userSchema = {
  include: {
    service: 'users',
    nameAs: 'user',
    parentField: 'user',
    childField: '_id'
  }
}

const commentSchema = {
  include: {
    service: 'comment',
    nameAs: 'comment',
    parentField: 'comment',
    childField: '_id'
  }
}

const populateFieldsIfTA =
commonHooks.when(hook => !!hook.params.user &&
  (hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  [commonHooks.populate({schema: userSchema}),
    commonHooks.populate({schema: commentSchema})]
);

const discardFieldsIfStudent =
commonHooks.when(hook => !!hook.params.user &&
  (hook.params.user.role === 'Student'),
  [
    commonHooks.discard('user','userName',
    'fulfilledBy', 'fulfilledByName',
    'desc', 'isBeingHelped', 'cancelledByTA',
    'noShow', 'shouldIgnoreInTokenCount',
    'comment', 'dequeuedAt', 'closedAt')
  ]
);

const setUserName = context => {
  if (!!context.data && !!context.params.user) {
    context.params.userName = context.params.user.name || context.params.user.directoryID;
  }
}

const validatePasscode = context => {
  if (!!context.data && ((typeof context.data.passcode) === "string")
    && context.data.passcode.toLowerCase().trim() === context.app.passcode) {
      return context;
  }
  throw new errors.BadRequest('Incorrect passcode', { errors: { passcode: context.data.passcode } });
}

const emitQueuePositionUpdate = context => {
  context.app.io.emit("queue update");
}

const filterXSS = context => {
  if (context.data) {
    if ((typeof context.data.desc) === "string") {
      context.data.desc = context.data.desc.substring(0, MAX_DESC_LEN);
      context.data.desc = xss(context.data.desc);
    }
  }

  return context;
}

const validateTokens = context => {

  const MAX_TOKENS = context.app.get('tokens').max;
  const lastMidnight = new Date();
  lastMidnight.setHours(0,0,0,0);

  return context.app.service('/tokens').find({
    query: {
      createdAt: {
        $gt: lastMidnight.getTime(),
      },
      user: context.params.user._id,
      cancelledByStudent: false,
    }
  })
  .then(res => {
    const tokensRemaining = (MAX_TOKENS-res.total) < 0 ? 0 : (MAX_TOKENS-res.total);
    if (tokensRemaining > 0) {
      return context;
    } else {
      throw new errors.BadRequest('Out of tokens', { errors: { tokensRemaining: 0 } });
    }
    res.data.map(token => {
      if (!token.fulfilled) {
        throw new errors.BadRequest('Already in the queue', { errors: { tokensRemaining } });
      }
    })
  })
  .catch(function(err) {
    // TODO: this error checking code is questionable, look into this
    if (err.message === 'Out of tokens' || err.message === 'Already in the queue') {
      throw new errors.BadRequest('Out of tokens', { errors: { tokensRemaining: 0 } });
    } else if (err.message === 'Incorrect passcode') {
      throw err;
    } else {
      throw new errors.BadRequest('Token calculation error', { errors: { } });
    }
  });
}

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [restrictToTAOrSelf, search({
      fields: ['userName', 'fulfilledByName', 'desc']
    })],
    get: [restrictToTAOrSelf],
    // TODO: validate description length
    create: [auth.associateCurrentUser({as: 'user'}),
      validatePasscode,
      validateTokens,
      setUserName,
      commonHooks.discard('passcode'),
      filterXSS
    ],
    update: [restrictToTAOrSelf, discardFieldsIfStudent, filterXSS],
    patch: [restrictToTAOrSelf, discardFieldsIfStudent, filterXSS],
    remove: [commonHooks.disallow()] // tickets should be immutable
  },

  after: {
    all: [],
    find: [populateFieldsIfTA],
    get: [populateFieldsIfTA],
    create: [emitQueuePositionUpdate],
    update: [emitQueuePositionUpdate, commonHooks.setUpdatedAt()],
    patch: [emitQueuePositionUpdate, commonHooks.setUpdatedAt()],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
