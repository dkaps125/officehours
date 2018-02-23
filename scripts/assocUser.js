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
  .description('update columns')
  .action(function() {
    app.service('tokens').find({
      query: {
        $limit: 1000,
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

program.parse(process.argv);
