// users-model.js - Users model

// User's global role should decide whether they have rights to edit users' creds
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const users = new mongooseClient.Schema({
    directoryID: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      enum: ["Student", "Instructor", "TA", "Admin"],
      required: true
    },
    roles: [{
      type: {
        type: String,
        enum: ["Student", "Instructor", "TA", "Admin"],
      },
      course: {
        type: Schema.Types.ObjectId,
        ref: "course"
      }
    }],
    onDuty: {
      type: Boolean,
      default: false,
    },
    onDutyCourse: {
      type: Schema.Types.ObjectId,
      ref: "course"
    },
    name: {
      type: String
    },
    location: {
      type: String,
      default: "TA Room",
    },
    totalTickets: {
      type: Number,
      default: 0
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  return mongooseClient.model('users', users);
};
