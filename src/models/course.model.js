// course-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const course = new Schema({
    title: { type: String, required: true, maxlength: 140, trim: true },
    courseid: { type: String, required: true, maxlength: 20, trim: true },
    ohURL: { type: String },
    ohLocations: [{ type: String, required: true, maxlength: 20, trim: true, unique: true }],
    // GREG TODO: move semester to its own entity
    semester: {
      term: { type: String, enum: ['Winter', 'Spring', 'Summer', 'Fall'], required: true },
      year: { type: Number,
        required: true,
        validate: {
          validator: function(v) { return v > 2018 }
        }
      }
    },
    requiresPasscode: { type: Boolean, required: true, default: true }
    // future: dept
  }, {
    timestamps: true
  });

  return mongooseClient.model('course', course);
};
