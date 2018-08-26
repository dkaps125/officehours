// users-model.js - Users model

// User's global role should decide whether they have rights to edit users' creds
module.exports = function(app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const users = new mongooseClient.Schema({
    directoryID: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      enum: ['Student', 'Instructor', 'TA', 'Admin']
    },
    permissions: [
      {
        type: String,
        // instrs must have course_mod, user_view, user_mod
        // instrs may have course_create, user_create, user_mod, all others
        // tas must have user_view
        // if admin is checked, all should automatically be checked
        // only admins can delete users
        enum: ['global_ticket_view', 'course_create', 'course_mod', 'user_create', 'user_mod', 'user_delete', 'user_view', 'admin']
      }
    ],
    roles: [
      {
        privilege: {
          type: String,
          enum: ['Student', 'Instructor', 'TA'],
          required: true
        },
        course: {
          type: Schema.Types.ObjectId,
          ref: 'course',
          required: true
        },
        totalTickets: {
          type: Number,
          default: 0,
        }
      }
    ],
    onDuty: {
      type: Boolean,
      default: false
    },
    onDutyCourse: {
      type: Schema.Types.ObjectId,
      ref: 'course'
    },
    name: {
      type: String
    },
    location: {
      type: String,
      default: 'TA Room'
    },
    totalTickets: {
      type: Number,
      default: 0
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  return mongooseClient.model('users', users);
};
