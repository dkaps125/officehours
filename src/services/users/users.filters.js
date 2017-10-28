/* eslint no-console: 1 */
module.exports = function (data, connection, hook) { // eslint-disable-line no-unused-vars
  // prevent students from seeing events that do not belong to them
  if (!connection.user || (!(connection.user.role === "Instructor" || connection.user.role === "TA")
  && !(connection.user._id.toString() !== data.user._id.toString()))) {
    return false;
  }
  return data;
};
