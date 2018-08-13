const { authenticate } = require("@feathersjs/authentication").hooks;
const auth = require("feathers-authentication-hooks");
const commonHooks = require("feathers-hooks-common");
const errors = require("@feathersjs/errors");
const xss = require("xss");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const MAX_TEXT_LEN = 500;

const restrictToTA = commonHooks.when(
  hook =>
    !!hook.params.user &&
    !(hook.params.user.role === "Instructor" || hook.params.user.role === "TA"),
  commonHooks.disallow()
);

const isUserInCourse = (user, courseDbId) => {
  const privs =
    user &&
    user.roles &&
    user.roles.filter(role => role.course.toString() === courseDbId.toString());
  return privs && privs.length > 0 && !!privs[0];
};

// Vaidate user querying belongs in course, TODO: exceptions for admins
const restrictToCourse = async context => {
  console.log('restr to course: ', context.params);
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
    throw new errors.Forbidden("User is not in this course", {
      errors: { course: query.course }
    });
  }
}

const validateCourse = context => {
  console.log('comment hook', context.params);
  if (!isUserInCourse(context.params.user, context.data.course)) {
    throw new errors.Forbidden("User is not in this course", {
      errors: { course: context.data.course }
    });
  }

  return context.app
    .service("/courses")
    .get(context.data.course)
    .then(res => {
      if (!res) {
        throw new errors.BadRequest("Course not found", {
          errors: { course: context.data.course }
        });
      }
      return context;
    })
    .catch(err => {
      console.error("validateCourse: ", err);
      throw new errors.BadRequest("Course not found", {
        errors: { course: context.data.course }
      });
    });
};

// TODO: pull these out, dedupe code
const courseSchema = {
  include: {
    service: "course",
    nameAs: "course",
    parentField: "course",
    childField: "_id"
  }
};

const populateCourse = commonHooks.populate({ schema: courseSchema });

const filterXSS = context => {
  if (context.data) {
    if (typeof context.data.text === "string") {
      context.data.text = context.data.text.substring(0, MAX_TEXT_LEN);
      context.data.text = xss(context.data.text);
    }
  }
  return context;
};

const aggregateToks = hook => {
  if ("_aggregate" in hook.params.query && !!hook.params.query._aggregate) {
    if (
      hook.params.query._aggregate.length > 0 &&
      "$match" in hook.params.query._aggregate[0]
    ) {
      if ("student" in hook.params.query._aggregate[0].$match) {
        const student = hook.params.query._aggregate[0].$match.student;
        hook.params.query._aggregate[0].$match.student = ObjectId(student);
      } else if ("ta" in hook.params.query._aggregate[0].$match) {
        const ta = hook.params.query._aggregate[0].$match.ta;
        hook.params.query._aggregate[0].$match.ta = ObjectId(ta);
      }
    }
    hook.result = hook.service.Model.aggregate(hook.params.query._aggregate);
  }
};

module.exports = {
  before: {
    all: [authenticate("jwt"), restrictToTA],
    find: [aggregateToks],
    get: [],
    create: [auth.associateCurrentUser({ as: "ta" }), filterXSS, validateCourse],
    update: [auth.restrictToOwner({ ownerField: "ta" }), filterXSS, validateCourse],
    patch: [auth.restrictToOwner({ ownerField: "ta" }), filterXSS, validateCourse],
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
