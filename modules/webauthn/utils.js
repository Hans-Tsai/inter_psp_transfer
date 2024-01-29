const crypto = require('crypto');

function randomChallenge() {
  return crypto.randomUUID()
}

module.exports = {
  randomChallenge,
};