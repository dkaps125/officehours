const { authenticate } = require('@feathersjs/authentication').hooks;
const auth = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const xss = require('xss');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const MAX_TEXT_LEN = 500;

const privForCourse = (user, course) => {
  const privs = user && course && user.roles && user.roles.filter(role => role.course.toString() === course.toString());

  return privs && privs.length > 0 && privs[0];
};

const isInstrOrTa = (user, course) => {
  const roleForCourse = privForCourse(user, course);
  return roleForCourse && (roleForCourse.privilege === 'Instructor' || roleForCourse.privilege === 'TA');
};

const tryGetCourse = context => {
  if (context.result && context.result.course) {
    return context.result.course;
  }

  if (context.params && context.params.query && context.params.query.course) {
    return context.params.query.course;
  }

  if (context.data && context.data.course) {
    return context.data.course;
  }

  return null;
}

// context.data && context.data.course gives the right thing
const restrictToTA = commonHooks.when(
  context =>
    !!context.params.provider && (!context.params.user || (
    !context.params.user.permissions.includes('admin') &&
    !context.params.user.permissions.includes('course_mod') &&
    !isInstrOrTa(
      context.params.user,
      tryGetCourse(context)
    ))),
  commonHooks.disallow('external')
);

const isUserInCourse = (user, courseDbId) => {
  const privs = user && user.roles && user.roles.filter(role => role.course.toString() === courseDbId.toString());
  return privs && privs.length > 0 && !!privs[0];
};

// TODO: get rid of this test code
// Vaidate user querying belongs in course, TODO: exceptions for admins
const restrictToCourse = async context => {
  const { query } = context.params;

  // TODO: inject an OR query to all courses the user is an instr or TA in unless they're admin
  // to prevent unauthorized access to other courses.
  /*
  if(user.roles.includes('admin') || user.roles.includes('superadmin')) {
    return context;
  }
  if(!context.id) {
    // When requesting multiple, restrict the query to the user
    context.params.query.course = user._id;
  } else {
    // When acessing a single item, check first if the user is an owner
    const item = await context.service.get(context.id);

    if(item._id !== user._id) {
      throw new Forbidden('You are not allowed to access this');
    }
  */

  if (query && query.course && !isUserInCourse(context.params.user, query.course)) {
    throw new errors.Forbidden('User is not in this course', {
      errors: { course: query.course }
    });
  }
};

const validateCourse = context => {
  if (!context.params.provider) {
    return context;
  }

  if (!context.data || !context.data.course) {
    throw new errors.BadRequest('Malformed request');
  }

  const { course, roleForCourse, user } = context.params;

  if (!course) {
    throw new errors.Forbidden('User is not in this course', {
      errors: { course: context.data.course }
    });
  }};

// TODO: pull these out, dedupe code
const courseSchema = {
  include: {
    service: 'course',
    nameAs: 'course',
    parentField: 'course',
    childField: '_id'
  }
};

const populateCourse = commonHooks.populate({ schema: courseSchema });

const filterXSS = context => {
  if (context.data) {
    if (typeof context.data.text === 'string') {
      context.data.text = context.data.text.substring(0, MAX_TEXT_LEN);
      context.data.text = xss(context.data.text);
    }
  }
  return context;
};

const aggregateToks = context => {
  if ('_aggregate' in context.params.query && !!context.params.query._aggregate) {
    if (context.params.query._aggregate.length > 0 && '$match' in context.params.query._aggregate[0]) {
      if ('student' in context.params.query._aggregate[0].$match) {
        const student = context.params.query._aggregate[0].$match.student;
        context.params.query._aggregate[0].$match.student = ObjectId(student);
      } else if ('ta' in context.params.query._aggregate[0].$match) {
        const ta = context.params.query._aggregate[0].$match.ta;
        context.params.query._aggregate[0].$match.ta = ObjectId(ta);
      }
    }
    context.result = context.service.Model.aggregate(context.params.query._aggregate);
  }
};

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [restrictToTA, aggregateToks],
    get: [commonHooks.disallow('external')], // I don't think we use this
    create: [restrictToTA, auth.associateCurrentUser({ as: 'ta' }), filterXSS, validateCourse],
    update: [restrictToTA, auth.restrictToOwner({ ownerField: 'ta' }), filterXSS, validateCourse],
    patch: [restrictToTA, auth.restrictToOwner({ ownerField: 'ta' }), filterXSS, validateCourse],
    remove: [commonHooks.disallow()] // comments should be immutable
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
