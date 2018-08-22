// global-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function(app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const global = new Schema(
    {
      configured: { type: Boolean, default: false }
    },
    {
      timestamps: true
    }
  );

  return mongooseClient.model('global', global);
};
