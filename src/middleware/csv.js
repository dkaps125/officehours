const auth = require('@feathersjs/authentication');
const xss = require('xss');
const transform = require('stream-transform');
const stringify = require('csv-stringify');
const csv = require('csv-parse');
const fs = require('fs');

module.exports = function(options = {}) {
  const app = options.app;
  const userQuery = app.service('users');
  const courseQuery = app.service('courses');

  return function userCSV(req, res, next) {
    var failed = false;
    var failure = err => {
      if (!failed) {
        failed = true;
        res.status(400);
        res.format({
          'application/json': () => {
            res.json({ error: { cause: err, isOperational: true }, status: 'error' });
          }
        });
        console.log(err);
      }
    };

    if (!req.user.permissions.includes('user_create') || !req.user.permissions.includes('user_mod')) {
      failure('Unauthorized: user missing user_create and/or user_mod permissions');
      return;
    }

    const parseUser = transform(function(record, cb) {
      if (!record || !record.name || !record.directoryId) {
        failure('Malformed CSV record, missing name or directoryID');
        return;
      }
      if (!!record.role && record.role.length > 0 && record.role.toLowerCase() !== 'ta') {
        record.role = record.role.substr(0, 1).toUpperCase() + record.role.substr(1, record.length).toLowerCase();
      } else if (!!record.role && record.role.toUpperCase() == 'TA') {
        record.role = record.role.toUpperCase();
      }
      if (record.role !== 'Student' && record.role !== 'Instructor' && record.role !== 'TA') {
        record.role = 'Student';
      }

      var query = {
        directoryID: xss(record.directoryId),
        name: xss(record.name ? record.name.trim() : 'NoName')
      };

      let courseId;
      if (record.course) {
        record.course = record.course.toUpperCase();
        courseQuery
          .find({
            query: {
              courseid: record.course
            }
          })
          .then(res => {
            if (res.data.length === 0) {
              failure(`Course ${record.course} for ${record.name} not found`);
              return;
            }
            courseId = res.data[0]._id;
            query.roles = [
              {
                course: courseId,
                privilege: record.role
              }
            ];
            return userQuery.find({
              query: { directoryID: query.directoryID }
            });
          })
          .then(res => {
            if (res.total === 0) {
              return userQuery.create(query);
            } else {
              const user = res.data[0];
              if (user.roles && user.roles.length > 0) {
                const maybePrivs = user.roles.filter(role => role.course.toString() === courseId.toString());
                if (maybePrivs && maybePrivs.length > 0) {
                  failure(`${record.name} is already enrolled in ${record.course}`);
                  return;
                }
              }
              return userQuery.patch(user._id, {
                $push: {
                  roles: {
                    course: query.roles[0].course,
                    privilege: query.roles[0].privilege
                  }
                }
              });
            }
          })
          .then(res => {
            cb();
          })
          .catch(err => {
            cb();
          });
      } else {
        userQuery
          .create(query)
          .then(res => {
            cb();
          })
          .catch(err => {
            cb();
          });
      }
    });

    var parser = csv({ columns: true, relax_column_count: true, trim: true }).on('error', err => {
      failure(err.message || 'Malformed CSV');
    });

    const csvInput = fs.createReadStream(req.file.path);
    csvInput
      .pipe(parser)
      .pipe(parseUser)
      .on('finish', () => {
        if (!failed) {
          res.status(200);
          res.format({
            'application/json': () => {
              res.json({ status: 'success' });
            }
          });
        }
        if (!!req.file && !!req.file.path) {
          fs.unlink(req.file.path, err => {
            if (err) failure(err.message || 'Could not unlink file');
          });
        }
      })
      .on('error', err => {
        failure(err.message || 'Malformed CSV passed');
      });
  };
};
