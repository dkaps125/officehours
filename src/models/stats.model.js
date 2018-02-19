// stats-model.js - A mongoose model
// 
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;

  // hourly stats
  const stats = new Schema({
    forHour : { type: Date, default: Date.now },
    totalTickets: { type: Number, default: 0 },
    tas: [{
      id: { type: Schema.Types.ObjectId, ref: 'user',  required: true },
      totalTickets: { type: Number, default: 0 },
      totalTimeSpent: { type: Number, default: 0 },
      allTickets: [{ type: Schema.Types.ObjectId, ref: 'token' }]
    }],
    students: [{
      id: { type: Schema.Types.ObjectId, ref: 'user', required: true },
      totalTickets: { type: Number, default: 0 },
      totalTimeInQueue: { type: Number, default: 0 },
      allTickets: [{ type: Schema.Types.ObjectId, ref: 'token' }]
    }],
    // if we change stats later on, keep this
    statsVersion: { type: Number, default: 1 },
  }, {
    timestamps: true,
  });

  return mongooseClient.model('stats', stats);
};
