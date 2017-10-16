const assert = require('assert');
const app = require('../../src/app');

describe('\'dequeueStudent\' service', () => {
  it('registered the service', () => {
    const service = app.service('dequeue-student');

    assert.ok(service, 'Registered the service');
  });
});
