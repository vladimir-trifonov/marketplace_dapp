module.exports = (uri) => {
  const mongoose = require('mongoose')
  mongoose.Promise = global.Promise
  mongoose.connect(uri)
  const db = mongoose.connection
  db.on('error', console.error.bind(console, 'MongoDB connection error:'))
}
