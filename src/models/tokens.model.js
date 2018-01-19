// tokens-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const tokens = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    fulfilled: {
      type: Boolean,
      default: false,
    },
    fulfilledBy: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    isClosed: {
      type: Boolean,
      default: false
    },
    desc: {
      type: String,
      maxLength: 200
    },
    isBeingHelped: {
      type: Boolean,
      default: false
    },
    cancelledByStudent: {
      type: Boolean,
      default: false
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  return mongooseClient.model('tokens', tokens);
};
