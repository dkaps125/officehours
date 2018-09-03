const { authenticate } = require('@feathersjs/authentication').hooks;
const { restrictToOwner } = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const xss = require('xss');

const hasRole = (role, hook) => hook.params.user.permissions.includes(role);

const restrict = [
  authenticate('jwt'),
  restrictToOwner({
    idField: '_id',
    ownerField: '_id'
  })
];

const restrictCreate = [
  authenticate('jwt'),
  commonHooks.when(hook => !!hook.params.user &&
    !(hasRole('user_create', hook) || hasRole('admin', hook)),
  commonHooks.disallow('external'))
];

const restrictMod = [
  authenticate('jwt'),
  commonHooks.when(hook => !!hook.params.user &&
    !(hasRole('user_mod', hook) || hasRole('admin', hook)),
  commonHooks.disallow('external'))
];

const restrictRemove = [
  authenticate('jwt'),
  commonHooks.when(hook => !!hook.params.user &&
    !(hasRole('user_delete', hook) || hasRole('admin', hook)),
  commonHooks.disallow('external'))
];


const restrictGet = [
  commonHooks.when(hook => !!hook.params.provider && !!hook.params.user &&
    !(hasRole('user_view', hook) || hasRole('admin', hook)),
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
    ...restrictGet
    ],
    get: [ ...restrictGet ],
    create: [ ...restrictCreate],
    update: [ ...restrictMod, commonHooks.setUpdatedAt() ],
    patch: [ ...restrictMod, commonHooks.setUpdatedAt() ],
    remove: [ ...restrictRemove ]
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
    // TODO: on duty for different courses
    patch: [commonHooks.when(hook => (hook.result.role === "Instructor" || hook.result.role === "TA"),
      (hook) => {
        hook.app.service('/users').find(
          {
            query: {
              $or: [
                {role: "TA"},
                {role: "Instructor"},
                {role: "Admin"}
              ],
              onDuty: true,
              // TODO: onDutyCourse: hook.params.course ????
            }
          }).then(res => {
            hook.app.io.emit('availabletas updated', res);
            // hook.app.io.emit('availabletas updated ' + hooks.params.course, res);
          });
          return hook;
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
