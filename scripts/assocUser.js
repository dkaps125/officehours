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

//mongoose.connect(config.mongodb);

// This must be exec'd before the search service can work:
// db.tokens.dropIndex("desc_text_user_text_fulfilledByName_text");
program
  .command('addUserName')
  .description('update columns for token fulfilledByName')
  .action(function() {
    app.service('tokens').find({
      query: {
        $limit: 1500,
      }
    }).then(tickets => {
      tickets.data.map(ticket => {
        app.service('users').get({_id: ticket.user})
        .then(user => {
          console.log(user);
          app.service('tokens').patch(ticket._id, {
            userName: user.name,
          }).catch(function(err) {
              console.error('mongoose error');
              console.error(err);
              process.exit(1);
          })
        })
      });
      // map is synchronous apparently
      //process.exit(0);

    }).catch(function(err) {
        console.error('mongoose error');
        console.error(err);
        process.exit(1);
    });
  });

  program
    .command('addUserTotal')
    .description('update columns for user total')
    .action(function() {
      app.service('/users').find({
      }).then(users => {
        users.data.map(user => {
          var q = {
            query: {
              $limit: 0,
              user: user._id
            }
          }
          if (user.role !== "Student") {
            q.query = {
              $limit: 0,
              fulfilledBy: user._id
            }
          }
          app.service('/tokens').find(
            q
          ).then(tokens => {
            console.log(user.name + ': ' + tokens.total);
            return app.service('/users').patch(user._id, {
              totalTickets: tokens.total
            });
          }).catch(err => {
            console.error('mongoose error 2');
            console.error(err);
            process.exit(1);
          });
        });
        // map is synchronous apparently
        //process.exit(0);

      }).catch(function(err) {
          console.error('mongoose error');
          console.error(err);
          process.exit(1);
      });
    });


program.parse(process.argv);
