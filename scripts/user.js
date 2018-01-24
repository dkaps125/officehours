const program = require('commander');
const mongoose = require('mongoose');
const app = require('../src/app.js');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config/production.json');
} else {
  config = require('../config/default.json');
}

mongoose.Promise = global.Promise;

mongoose.connect(config.mongodb);

program
  .command('adduser <username> <role> <firstname> <lastname>')
  .description('add a user')
  .action(function(directoryID, role, first, last, options) {
    app.service('users').create({
      directoryID: directoryID,
      role: role,
      name: first+" "+last,
    }).then(user => {
      console.log('created user '+user);
      process.exit(0);
    }).catch(function(err) {
        console.error('mongoose error');
        console.error(err);
        process.exit(1);
    });
  });

program.parse(process.argv);
