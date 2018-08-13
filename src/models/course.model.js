// course-model.js - A mongoose model
//
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const course = new Schema({
    title: { type: String, required: true, maxlength: 140, trim: true },
    courseid: { type: String, required: true, maxlength: 20, trim: true, unique: true },
    ohURL: { type: String },
    ohLocations: [{ type: String, required: true, maxlength: 20, trim: true }],
    semester: {
      term: { type: String, enum: ['Winter', 'Spring', 'Summer', 'Fall'], required: true },
      year: { type: Number,
        required: true,
        validate: {
          validator: function(v) { return v >= 2018 }
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
