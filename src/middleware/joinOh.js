// bekher: middleware to join office hours without any extra permissions

module.exports = function(options = {}) {
  const { app } = options;
  const userService = app.service('/users');

  return function configure(req, res, next) {
    const { user } = req;
    if (!req.body) {
      res.json({ message: null, error: 'No on duty status provided', user });
    }

    // TODO: if !TA or not in course, throw something

    const { isOnDuty, onDutyCourse } = req.body;
    userService
      .patch(user._id, {
        onDuty: isOnDuty,
        onDutyCourse
      })
      .then(me => {
        app.service('/users').find(
          {
            query: {
              onDuty: true,
              onDutyCourse
            }
          }
        ).then(res => {
          app.io.emit(`availabletas updated ${onDutyCourse}`);
        }).catch(err => {
          console.error('joinOh:', err);
        });
        res.json({ message: 'On duty status changed', error: null, user: me });
      })
      .catch(err => {
        console.log('joinOH: Cannot update user', err);
        // TODO error out here
        res.json({ message: null, error: 'Cannot patch user', user });
      });
  };
};
