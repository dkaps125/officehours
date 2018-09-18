const { authenticate } = require('@feathersjs/authentication').hooks;
const commonHooks = require('feathers-hooks-common');
const xss = require('xss');

const hasRole = (role, hook) => hook.params.user.permissions.includes(role);
const isInstructor = (hook) => {
  const role = roleForCourse(hook.params.user, hook.id);
  return role && role.privilege === 'Instructor';
}

const restrictCreate = [
  commonHooks.when(hook => !!hook.params.user &&
    !(hasRole('admin', hook) || hasRole('course_create', hook)),
  commonHooks.disallow('external'))
];

const restrictMod = [
  commonHooks.when(hook => !hook.params.user ||
    !(hasRole('admin', hook) || hasRole('course_mod', hook) || isInstructor(hook)),
  commonHooks.disallow('external'))
];

const restrictRemove = [
  commonHooks.when(hook => !!hook.params.user &&
    !(hasRole('admin', hook)),
  commonHooks.disallow('external'))
];

const roleForCourse = (user, course) => {
  const privs = user && course && user.roles && user.roles.filter(role => role.course.toString() === course.toString());

  return privs && privs.length > 0 && privs[0];
};

const filterXSS = (context) => {
  if (context.data){
    if (context.data.title) {
      context.data.title = xss(context.data.title);
    }
    if (context.data.courseid) {
      context.data.courseid = xss(context.data.courseid);
    }
    if (context.data.ohURL) {
      context.data.ohURL = xss(context.data.ohURL);
    }
    if (context.data.ohLocations) {
      context.data.ohLocations = context.data.ohLocations.map(loc => {
        return xss(loc);
      });
    }
    if (context.data.studentMessaging) {
      context.data.studentMessaging = xss(context.data.studentMessaging);
    }

  }
  return context;
}

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [],
    get: [],
    create: [...restrictCreate, filterXSS],
    update: [...restrictMod, filterXSS, commonHooks.setUpdatedAt()],
    patch: [...restrictMod, filterXSS, commonHooks.setUpdatedAt()],
    remove: [...restrictRemove]
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
