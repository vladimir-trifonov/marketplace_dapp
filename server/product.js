var mongoose = require('mongoose')
mongoose.Promise = global.Promise

var Schema = mongoose.Schema

var ProductSchema = new Schema({
  blockchainId: Number,
  name: String,
  category: String,
  ipfsImageHash: String,
  ipfsDescHash: String,
  price: Number,
  condition: Number,
  status: Number
})

var ProductModel = mongoose.model('ProductModel', ProductSchema)

module.exports = ProductModel
