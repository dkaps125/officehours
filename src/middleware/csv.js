const auth = require('@feathersjs/authentication');
const xss = require('xss');
const transform = require('stream-transform');
const stringify = require('csv-stringify');
const csv = require('csv-parse');
const fs = require('fs');

module.exports = function (options = {}) {
  const app = options.app
  const userQuery = app.service('users');

  return function userCSV(req, res, next) {
    var failed = false;
    var failure = (err) => {
      if (!failed) {
        failed = true;
        res.status(400);
        res.format({
          'application/json': () => {
            res.json({error: {"cause": err, "isOperational": true}, status: "error"});
          }
        });
        console.log(err);
      }
    }

    if (!req.user.permissions.contains('user_create') || !req.user.permissions.contains('user_mod')) {
      failure("unauthorized");
    }

    const parseUser = transform( function(record, cb) {
      if (!record || !record.name || !record.directoryId) {
        failure("Malformed CSV record, missing name or directoryID");
        return;
      }
      if (!!record.role && record.role.length > 0 && record.role.toLowerCase() != "ta") {
        record.role = record.role.substr(0,1).toUpperCase() + record.role.substr(1,record.length).toLowerCase();
      } else if (!!record.role && record.role.toUpperCase() == "TA") {
        record.role = record.role.toUpperCase();
      }
      if (record.role !== "Student" && record.role !== "Instructor" && record.role !== "TA") {
        record.role = "Student";
      }

      userQuery.create({
        directoryID: xss(record.directoryId),
        name: xss(record.name),
        role: xss(record.role)
      }).then(res => {
        cb();
      }).catch(err => {
        cb();
      });
    });

    var parser = csv({columns: true})
    .on('error', err => {
      failure(err.message || "Malformed CSV");
    });
    const csvInput = fs.createReadStream(req.file.path);
    csvInput.pipe(parser)
    .pipe(parseUser)
    .on('finish', () => {
      if (!failed) {
        res.status(200);
        res.format({
          'application/json': () => {
            res.json({status: "success"});
          }
        });
      }
      if (!!req.file && !!req.file.path) {
        fs.unlink(req.file.path)
      }
    })
    .on('error', err => {
      failure(err.message || "Malformed CSV passed");
    });
  };
};
