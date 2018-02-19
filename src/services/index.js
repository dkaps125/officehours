const users = require('./users/users.service.js');
const tokens = require('./tokens/tokens.service.js');
const numtokens = require('./numtokens/numtokens.service.js');
const availabletas = require('./availabletas/availabletas.service.js');
const dequeueStudent = require('./dequeue-student/dequeue-student.service.js');
const queuePosition = require('./queue-position/queue-position.service.js');
const passcode = require('./passcode/passcode.service.js');
const comment = require('./comment/comment.service.js');
const stats = require('./stats/stats.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(users);
  app.configure(tokens);
  app.configure(numtokens);
  app.configure(availabletas);
  app.configure(dequeueStudent);
  app.configure(queuePosition);
  app.configure(passcode);
  app.configure(comment);
  app.configure(stats);
};
