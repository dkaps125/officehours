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

    const { ticketId, userId } = req.body;
    let course;
    app
      .service('/tokens')
      .get(ticketId)
      .then(ticket => {
        if (!ticket) {
          throw new errors.BadRequest('Cannot find ticket');
        }
        course = ticket.course;
        const requestorRole = roleForCourse(user, course);
        if (!requestorRole || (requestorRole.privilege !== 'Instructor' && requestorRole.privilege !== 'TA')) {
          throw new errors.Forbidden('Insufficent permissions');
        }
        return app.service('/tokens').patch(ticketId, {
          isBeingHelped: false,
          isClosed: true,
          noShow: true,
          closedAt: Date.now()
          // TODO: shouldIgnoreInTokenCount: false/true
        });
      })
      .then(updatedTicket => {
        app.io.emit(`queue update ${course}`);
        res.json({ message: 'Student marked as a no-show and ticket closed', error: null });
      })
      .catch(err => {
        console.error('markNoshow', err);
        throw new errors.BadRequest('Cannot mark student as no show');
      });
  };
};
