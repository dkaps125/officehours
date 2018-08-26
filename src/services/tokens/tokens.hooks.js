const { authenticate } = require('@feathersjs/authentication').hooks;
const auth = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const search = require('feathers-mongodb-fuzzy-search');
const errors = require('@feathersjs/errors');
const xss = require('xss');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const MAX_DESC_LEN = 200;

// !!hooks.params.provider true when external
const hasCoursePriv = (priv, user, courseDbId) => {
  const privs =
    user &&
    user.roles &&
    user.roles.filter(
      role =>
        role.privilege.toString().toLowerCase() === priv.toLowerCase() &&
        role.course.toString() === courseDbId.toString()
    );
  return privs && privs.length > 0 && !!privs[0];
};

// Greg TODO: pull these out into a package
const privForCourse = (user, course) => {
  const privs = user && course && user.roles && user.roles.filter(role => role.course.toString() === course.toString());

  return privs && privs.length > 0 && privs[0];
};

const isInstrOrTa = (user, course) => {
  const roleForCourse = privForCourse(user, course);
  return roleForCourse && (roleForCourse.privilege === 'Instructor' || roleForCourse.privilege === 'TA');
};
// TODO use the above

const restrictToTAOrSelf = commonHooks.when(
  context =>
    !!context.params.provider &&
    !!context.params.user &&
    !(context.params.user.permissions.includes('admin') || context.params.user.permissions.includes('course_mod')),
    auth.restrictToOwner({ ownerField: ['user', 'fulfilledBy'] })
);

const userSchema = {
  include: {
    service: 'users',
    nameAs: 'user',
    parentField: 'user',
    childField: '_id'
  }
};

const commentSchema = {
  include: {
    service: 'comment',
    nameAs: 'comment',
    parentField: 'comment',
    childField: '_id'
  }
};

/*
const populateFieldsIfTA = commonHooks.when(
  context => context.params.user && (context.params.user.role === 'Instructor' || context.params.user.role === 'TA'),
  [commonHooks.populate({ schema: userSchema }), commonHooks.populate({ schema: commentSchema })]
);
*/
// This works
const populateFieldsIfTa = commonHooks.when(
  context =>
    context.params.user &&
    (isInstrOrTa(context.params.user, context.params.query.course) ||
      context.params.user.permissions.includes('admin') ||
      context.params.user.permissions.includes('user_view')),
  [commonHooks.populate({ schema: userSchema }), commonHooks.populate({ schema: commentSchema })]
);

const discardFieldsIfStudent = commonHooks.when(
  context => !!context.params.user && context.params.user.role === 'Student',
  [
    commonHooks.discard(
      'user',
      'userName',
      'fulfilledBy',
      'fulfilledByName',
      'desc',
      /*'isBeingHelped',*/ 'cancelledByTA',
      'noShow',
      'shouldIgnoreInTokenCount',
      'comment',
      'dequeuedAt',
      'closedAt'
    )
  ]
);

const isUserInCourse = (user, courseDbId) => {
  const privs = user && user.roles && user.roles.filter(role => role.course.toString() === courseDbId.toString());
  return privs && privs.length > 0 && !!privs[0];
};

const setUserName = context => {
  if (context.data && !!context.params.user) {
    context.params.userName = context.params.user.name || context.params.user.directoryID;
  }
};

const incrTotalTickets = context => {
  if (context.data && !!context.params.user) {
    return context.app
      .service('/users')
      .get(context.params.user._id)
      .then(res => {
        var totalTickets = 1;
        if (!!res.totalTickets) {
          totalTickets = res.totalTickets + 1;
        }
        return context.app
          .service('/users')
          .patch(context.params.user._id, {
            totalTickets
          })
          .then(res => {
            return context;
          });
      });
  }
};

const validatePasscodeAndCourse = context => {
  if (!context.data || !context.data.course) {
    throw new errors.BadRequest('Malformed request');
  }

  const { course, roleForCourse, user } = context.params;

  if (!course || !roleForCourse) {
    throw new errors.Forbidden('User is not in this course', {
      errors: { course: context.data.course }
    });
  }

  // check course passcode requirement before it's populated in the after hook
  if (course.requiresPasscode) {
    if (
      typeof context.data.passcode === 'string' &&
      context.data.passcode.toLowerCase().trim() === context.app.passcode
    ) {
      return context;
    }
    throw new errors.BadRequest('Incorrect passcode', {
      errors: { passcode: context.data.passcode }
    });
  } else {
    return context;
  }
};

const emitQueuePositionUpdate = context => {
  context.app.io.emit('queue update'); // TODO + context.params.course
};

const filterXSS = context => {
  if (context.data) {
    if (typeof context.data.desc === 'string') {
      context.data.desc = context.data.desc.substring(0, MAX_DESC_LEN);
      context.data.desc = xss(context.data.desc);
    }
  }

  return context;
};

const validateTokens = context => {
  // guaranteed to have course
  const { course } = context.params;
  const maxTokens = course.dailyTokens || context.app.get('tokens').max;
  const lastMidnight = new Date();
  lastMidnight.setHours(0, 0, 0, 0);

  return context.app
    .service('/tokens')
    .find({
      query: {
        createdAt: {
          $gt: lastMidnight.getTime()
        },
        user: context.params.user._id,
        cancelledByStudent: false
      }
    })
    .then(res => {
      const tokensRemaining = maxTokens - res.total < 0 ? 0 : maxTokens - res.total;
      if (tokensRemaining > 0) {
        return context;
      } else {
        throw new errors.BadRequest('Out of tokens', {
          errors: { tokensRemaining: 0 }
        });
      }
      res.data.map(token => {
        if (!token.fulfilled) {
          throw new errors.BadRequest('Already in the queue', {
            errors: { tokensRemaining }
          });
        }
      });
    })
    .catch(function(err) {
      // TODO: this error checking code is questionable, look into this
      if (err.message === 'Out of tokens' || err.message === 'Already in the queue') {
        throw new errors.BadRequest('Out of tokens', {
          errors: { tokensRemaining: 0 }
        });
      } else if (err.message === 'Incorrect passcode') {
        throw err;
      } else {
        throw new errors.BadRequest('Token calculation error', { errors: {} });
      }
    });
};

const aggregateToks = context => {
  if ('_aggregate' in context.params.query && !!context.params.query._aggregate) {
    // ugly
    if (context.params.query._aggregate.length > 0 && '$match' in context.params.query._aggregate[0]) {
      if ('fulfilledBy' in context.params.query._aggregate[0].$match) {
        const fulfilledBy = context.params.query._aggregate[0].$match.fulfilledBy;
        context.params.query._aggregate[0].$match.fulfilledBy = ObjectId(fulfilledBy);
      } else if ('user' in context.params.query._aggregate[0].$match) {
        const user = context.params.query._aggregate[0].$match.user;
        context.params.query._aggregate[0].$match.user = ObjectId(user);
      }
    }
    context.result = context.service.Model.aggregate(context.params.query._aggregate);
  }
};

const assocCourse = context => {
  if (!context.data || !context.data.course) {
    return context;
  }

  return context.app
    .service('/courses')
    .get(context.data.course)
    .then(res => {
      if (!res) {
        throw new errors.BadRequest('Course not found', {
          errors: { course: context.data.course }
        });
      }
      context.params.course = res;
      context.params.roleForCourse = privForCourse(context.params.user, context.data.course);
    })
    .catch(err => {
      console.error(err);
      throw new errors.BadRequest('Course not found', {
        errors: { course: context.data.course }
      });
    });
};

const restrictQueryToCourses = context => {
  const { query, user } = context.params;
  // do not restrict for these roles
  if (!context.params.provider || user.permissions.includes('admin') || user.permissions.includes('global_ticket_view')) {
    return context;
  }

  // allowed courses for searching: ones where user is an instructor or TA
  const userCourses = user.roles
    .filter(role => role.privilege === 'Instructor' || role.privilege === 'TA')
    .map(role => role.course.toLowerCase());

  const courseRoleData = privForCourse(user, query.course);
  const courseRole = courseRoleData && courseRoleData.privilege;

  // restrict to course
  if (!query.course) {
    context.params.query = Object.assign(query, { course: { $in: userCourses } });
  }

  // if student, restrict to owner
  if (courseRole === 'Student') {
    context.params.query.user = user._id;
    return context; //this breaks it: auth.restrictToOwner({ ownerField: 'user' });
  } else if (courseRole === 'TA' || courseRole === 'Instructor') {
    // let them do what they want if they're an instr or or TA for this course
    return context;
  } else {
    // they're not enrolled
    throw new errors.BadRequest('Insufficent permissions for query', {
      errors: { course: context.data.course }
    });
  }
};

/* design decisions:
- only allow queries with course(s) specified that they're in
 - unless user has global_ticket_view
- don't try to restrict otherwise, just deny the user.
*/

// TOOD: https://feathers-plus.github.io/v1/feathers-hooks-common/guide.html#fastJoin

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [
      restrictQueryToCourses,
      aggregateToks,
      search({
        fields: ['userName', 'fulfilledByName', 'desc']
      })
    ],
    get: [restrictToTAOrSelf], // we don't use this?
    // TODO: validate description length
    create: [
      auth.associateCurrentUser({ as: 'user' }),
      assocCourse, // TODO: Greg moved this here, make sure it doesn't interefere
      validatePasscodeAndCourse,
      validateTokens,
      setUserName,
      incrTotalTickets,
      commonHooks.discard('passcode'),
      filterXSS
    ],
    update: [restrictToTAOrSelf, discardFieldsIfStudent, filterXSS],
    patch: [restrictToTAOrSelf, discardFieldsIfStudent, filterXSS],
    remove: [commonHooks.disallow()] // tickets should be immutable
  },

  after: {
    all: [],
    find: [populateFieldsIfTa],
    get: [populateFieldsIfTa],
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
