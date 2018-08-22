const assert = require('assert');
const app = require('../../src/app');

describe('\'global\' service', () => {
  it('registered the service', () => {
    const service = app.service('global');

    assert.ok(service, 'Registered the service');
  });
});
