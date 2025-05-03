const jwt = require('jsonwebtoken');

const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.SECRET_KEY, {
    expiresIn: '7d'
  });
};

module.exports = generateToken;
