const { authenticate } = require('@feathersjs/authentication').hooks;
const commonHooks = require('feathers-hooks-common');
const { restrictToOwner } = require('feathers-authentication-hooks');
const xss = require('xss');

const restrict = [
  authenticate('jwt'),
  restrictToOwner({
    idField: '_id',
    ownerField: '_id'
  })
];

const restrictToInstructor = [
  authenticate('jwt'),
  commonHooks.when(hook => !!hook.params.user &&
    !(hook.params.user.role === "Instructor"),
  commonHooks.disallow('external'))
];

const restrictToInstructorOrTA = [
  authenticate('jwt'),
  commonHooks.when(hook => !!hook.params.user &&
    !(hook.params.user.role === "Instructor" || hook.params.user.role === "TA"),
  commonHooks.disallow('external'))
];

const restrictGet = [
  commonHooks.when(hook => !!hook.params.user &&
    !(hook.params.user.role === "Instructor"
    || hook.params.user.role === "TA"),
    restrictToOwner({
      idField: '_id',
      ownerField: '_id'
    })
  )
];

const filterXSS = (context) => {
  if (!!context.data){
    if (!!context.data.name) {
      context.data.name = xss(context.data.name);
    }
    if (!!context.data.directoryID) {
      context.data.directoryID = xss(context.data.directoryID);
    }
  }
  return context;
}

module.exports = {
  before: {
    all: [filterXSS],
    find: [
    ...restrictToInstructorOrTA
    ],
    get: [ ...restrictGet ],
    create: [ ...restrictToInstructor],
    update: [ ...restrictToInstructorOrTA, commonHooks.setUpdatedAt() ],
    patch: [ ...restrictToInstructorOrTA, commonHooks.setUpdatedAt() ],
    remove: [ ...restrictToInstructor ]
  },

  after: {
    all: [
      commonHooks.when(
        hook => hook.params.provider,
        commonHooks.discard('password')
      )
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [commonHooks.when(hook => (hook.result.role === "Instructor" || hook.result.role === "TA"),
      (hook) => {
        hook.app.service('/users').find(
          {
            query: {
              $or: [
                {role: "TA"},
                {role: "Instructor"}
              ],
              onDuty: true
            }
          }).then(res => {
            hook.app.io.emit('availabletas updated', res);
          });
          return hook ;
      }
    )],
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
