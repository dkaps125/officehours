// bekher: middleware to join office hours without any extra permissions
const errors = require('@feathersjs/errors');

// Greg TODO: pull these out into a package
const roleForCourse = (user, course) => {
  const privs = user && course && user.roles && user.roles.filter(role => role.course.toString() === course.toString());
  return privs && privs.length > 0 && privs[0];
};

module.exports = function(options = {}) {
  const { app } = options;

  return function configure(req, res, next) {
    const { user } = req;
    if (!req.body) {
      res.json({ message: null, error: 'No ticket information provided', user });
    }

    let commentObj;
    let course;
    const { comment, ticketId, userId } = req.body;
    app.service('/tokens')
      .get(ticketId)
      .then(ticket => {
        if (!ticket) {
          throw new errors.BadRequest('Cannot find ticket');
        }
        const requestorRole = roleForCourse(user, ticket.course);
        if (!requestorRole || (requestorRole.privilege !== 'Instructor' && requestorRole.privilege !== 'TA')) {
          throw new errors.Forbidden('Insufficent permissions');
        }
        return app
          .service('comment')
          .create(comment, { user });
      }).then(newComment => {
        commentObj = newComment;
        return app.service('/users').get(userId);
      })
      .then(student => {
        course = comment.course;
        var role = roleForCourse(student, course);
        // total tix for course
        const tixForCourse = role.totalTickets ? role.totalTickets + 1 : 1;
        // total tix for user
        const totalTickets = res.totalTickets ? role.totalTickets + 1 : 1;
        role.totalTickets = tixForCourse;
        return app.service('/users').patch(
          null,
          {
            $set: { 'roles.$.totalTickets': totalTickets }
          },
          {
            query: {
              _id: userId,
              'roles._id': role._id
            }
          }
        );
      })
      .then(updatedStudent => {
        return app.service('/tokens').patch(
          ticketId,
          {
            isBeingHelped: false,
            isClosed: true,
            closedAt: Date.now(),
            comment: commentObj._id
          },
          { user }
        );
      })
      .then(closedTicket => {
        app.io.emit(`queue update ${course}`);
        res.json({ message: 'Ticket closed', error: null });
      })
      .catch(err => {
        console.error('closeTicket:', err);
        throw new errors.BadRequest('Error closing student ticket');
      });
  };
};
