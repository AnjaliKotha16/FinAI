const authValidator = require('./authValidator');
const transactionValidator = require('./transactionValidator');
const investmentValidator = require('./investmentValidator');

module.exports = {
  ...authValidator,
  ...transactionValidator,
  ...investmentValidator
};
