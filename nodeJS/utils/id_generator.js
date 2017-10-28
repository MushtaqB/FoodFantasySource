let FlakeIdGen = require('flake-idgen')
    , intformat = require('biguint-format')
    , generator = new FlakeIdGen;

exports.generateId = function () {
  return intformat(generator.next(), 'dec');
};
