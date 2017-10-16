const assert = require('assert');
const app = require('../../src/app');

describe('\'numtokens\' service', () => {
  it('registered the service', () => {
    const service = app.service('numtokens');

    assert.ok(service, 'Registered the service');
  });
});
