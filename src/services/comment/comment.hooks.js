const { authenticate } = require('@feathersjs/authentication').hooks;
const auth  = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const xss = require('xss');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const MAX_TEXT_LEN = 500;

const restrictToTA =
commonHooks.when(hook => !!hook.params.user &&
  !(hook.params.user.role === "Instructor"
  || hook.params.user.role === "TA"),
  commonHooks.disallow());

const validateCourse = context => {
  // check course passcode requirement before it's populated
  return context.app.service('/course').get(context.data.course).then(res => {
    if (!res) {
      throw new errors.BadRequest('Course not found', { errors: { course: context.data.course } });
    }
    return context;
  }).catch(err => {
    console.error('validateCourse: ', err);
    throw new errors.BadRequest('Course not found', { errors: { course: context.data.course } });
  })
}

// TODO: pull these out, dedupe code
const courseSchema = {
  include: {
    service: 'course',
    nameAs: 'course',
    parentField: 'course',
    childField: '_id'
  }
}

const populateCourse =
  commonHooks.populate({schema: courseSchema});

const filterXSS = context => {
  if (context.data) {
    if ((typeof context.data.text) === "string") {
      context.data.text = context.data.text.substring(0, MAX_TEXT_LEN);
      context.data.text = xss(context.data.text);
    }
  }
  return context;
};

const aggregateToks = hook => {
	if ('_aggregate' in hook.params.query && !!hook.params.query._aggregate) {
    if (hook.params.query._aggregate.length > 0 && '$match' in hook.params.query._aggregate[0]) {
      if ('student' in hook.params.query._aggregate[0].$match) {
        const student = hook.params.query._aggregate[0].$match.student;
        hook.params.query._aggregate[0].$match.student = ObjectId(student);
      } else if ('ta' in hook.params.query._aggregate[0].$match) {
        const ta = hook.params.query._aggregate[0].$match.ta;
        hook.params.query._aggregate[0].$match.ta = ObjectId(ta);
      }
    }
    hook.result = hook.service.Model.aggregate(hook.params.query._aggregate);
  }
};

module.exports = {
  before: {
    all: [ authenticate('jwt'), restrictToTA, validateCourse ],
    find: [aggregateToks],
    get: [],
    create: [auth.associateCurrentUser({as: 'ta'}), filterXSS],
    update: [auth.restrictToOwner({ ownerField: 'ta' }), filterXSS],
    patch: [auth.restrictToOwner({ ownerField: 'ta' }), filterXSS],
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
    all: [populateCourse],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
