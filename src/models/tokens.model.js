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
    fulfilledByName: {
      type: String,
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
    shouldIgnoreInTokenCount: {
      type: Boolean,
      default: false
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'comment'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    dequeuedAt: { type: Date },
    closedAt:  { type: Date }
    // TODO: verifier for closedAt
  });

  tokens.index({desc: 'text', user: 'text', fulfilledByName: 'text'});

  return mongooseClient.model('tokens', tokens);
};
