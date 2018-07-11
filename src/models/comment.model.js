// comment-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const comment = new Schema({
    text: { type: String },
    knowledgeable: { type: String, enum: ["Yes", "No", "Not sure"], default: "Not sure"},
    toldTooMuch: { type: String, enum: ["Yes", "No", "Not sure"], default: "Not sure"},
    shouldGetExtraToken: { type: Boolean, default: false },
    ta: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'token',
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'course'
    }
  }, {
    timestamps: true
  });

  return mongooseClient.model('comment', comment);
};
