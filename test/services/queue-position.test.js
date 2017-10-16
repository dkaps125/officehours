const assert = require('assert');
const app = require('../../src/app');

describe('\'queuePosition\' service', () => {
  it('registered the service', () => {
    const service = app.service('queue-position');

    assert.ok(service, 'Registered the service');
  });
});
