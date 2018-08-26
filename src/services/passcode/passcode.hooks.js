const { authenticate } = require('@feathersjs/authentication').hooks;
const commonHooks = require('feathers-hooks-common');

const privForCourse = (user, course) => {
  const privs = user && course && user.roles && user.roles.filter(role => role.course.toString() === course.toString());

  return privs && privs.length > 0 && privs[0];
};

const isInstrOrTa = (user, course) => {
  const roleForCourse = privForCourse(user, course);
  return roleForCourse && (roleForCourse.privilege === 'Instructor' || roleForCourse.privilege === 'TA');
};

const restrictToTA = commonHooks.when(
  context => console.log(context) ||
    !context.params.user ||
    !context.id ||
    !isInstrOrTa(context.params.user, context.id),
  commonHooks.disallow()
);
module.exports = {
  before: {
    all: [authenticate('jwt'), restrictToTA],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
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
