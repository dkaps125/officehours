const assert = require('assert');
const app = require('../../src/app');

describe('\'availabletas\' service', () => {
  it('registered the service', () => {
    const service = app.service('availabletas');

    assert.ok(service, 'Registered the service');
  });
});
