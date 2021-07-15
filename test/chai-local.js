const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

chai.use(chaiHttp);
chai.use(chaiAsPromised);
chai.use(sinonChai);
const { expect } = chai;

module.exports = { chai, expect };
