const assert = require('assert');
const app = require('../../src/app');

describe('\'passcode\' service', () => {
  it('registered the service', () => {
    const service = app.service('passcode');

    assert.ok(service, 'Registered the service');
  });
});
