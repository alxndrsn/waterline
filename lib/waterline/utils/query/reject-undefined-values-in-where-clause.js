var flaverr = require('flaverr');

module.exports = function(criteria) {
  var k;
  for(k in criteria) {
    if(criteria[k] === undefined) {
      throw flaverr('E_UNDEFINED_IN_WHERE_CLAUSE', new Error('Passing undefined in WHERE clauses can be dangerous >:('));
    }
  }
};
