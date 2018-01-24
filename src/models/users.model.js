// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const users = new mongooseClient.Schema({
    directoryID: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["Student", "Instructor", "TA"], required: true},
    onDuty: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String
    },
    location: {
      type: String,
      default: "TA Room",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  return mongooseClient.model('users', users);
};
