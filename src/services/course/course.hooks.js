const { authenticate } = require('@feathersjs/authentication').hooks;
const commonHooks = require('feathers-hooks-common');
const xss = require('xss');

const restrictToAdmin = [
  authenticate('jwt'),
  commonHooks.when(hook => !!hook.params.user &&
    !(hook.params.user.role === "Instructor"
    || hook.params.user.role === "Admin" ),
  commonHooks.disallow('external'))
];

const filterXSS = (context) => {
  if (!!context.data){
    if (!!context.data.title) {
      context.data.title = xss(context.data.title);
    }
    if (!!context.data.courseid) {
      context.data.courseid = xss(context.data.courseid);
    }
    if (!!context.data.ohURL) {
      context.data.ohURL = xss(context.data.ohURL);
    }
    if (!!context.data.ohLocations) {
      context.data.ohLocations = context.data.ohLocations.map(loc => {
        return xss(loc);
      });
    }

  }
  return context;
}

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [],
    get: [],
    create: [...restrictToAdmin, filterXSS],
    update: [...restrictToAdmin, filterXSS, commonHooks.setUpdatedAt()],
    patch: [...restrictToAdmin, filterXSS, commonHooks.setUpdatedAt()],
    remove: [...restrictToAdmin]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
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
