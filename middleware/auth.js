const jwt = require('jsonwebtoken')
const config = require('config')


module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token')

  if (!token){
    return res.status(401).json({ msg: 'Authorization denied'})
  }

  // Check token
  try {
    const decoded = jwt.verify(token, config.get('JWTSecret'))
    req.user = decoded.user
    next()
  } catch (error) {
    res.status(401).json({msg: 'Token is not valid'})
  }
}