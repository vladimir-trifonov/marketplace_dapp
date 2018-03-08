const marketplaceArtifacts = require('./build/contracts/Marketplace.json')
const contract = require('truffle-contract')
const Web3 = require('web3')
const cors = require('cors')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const Marketplace = contract(marketplaceArtifacts)
Marketplace.setProvider(provider)

const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const ProductModel = require('./product')
mongoose.connect('mongodb://localhost:27017/marketplace_dapp')
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

const express = require('express')
const app = express()

app.use(cors())

app.listen(3000, function () {
  console.log('Ethereum server listening on port 3000!')
})

function setupProductEventListner() {
  let productEvent
  Marketplace.deployed().then(function (contract) {
    productEvent = contract.NewProduct({ fromBlock: 0, toBlock: 'latest' })

    productEvent.watch(function (err, result) {
      if (err) {
        console.log(err)
        return
      }
      saveProduct(result.args)
    })
  })
}

setupProductEventListner()

function saveProduct(product) {
  ProductModel.findOne({ 'blockchainId': product._productId.toLocaleString() }, function (err, dbProduct) {

    if (dbProduct != null) {
      return
    }

    const product = new ProductModel({
      name: product._name, blockchainId: product._productId, category: product._category,
      ipfsImageHash: product._imageLink, ipfsDescHash: product._descLink, price: product._price, condition: product._productCondition,
      status: 0
    })
    product.save(function (err) {
      if (err) {
        handleError(err)
      } else {
        ProductModel.count({}, function (err, count) {
          console.log('count is ' + count)
        })
      }
    })
  })
}

app.get('/products', function (req, res) {
  const query = { status: { $eq: 0 } }

  if (req.query.category !== undefined) {
    query['category'] = { $eq: req.query.category }
  } else if (req.query.status !== undefined) {
    if (req.query.status === 'Unsold') {
      query['status'] = { $eq: 0 }
    } else if (req.query.status === 'Sold') {
      query['status'] = { $eq: 1 }
    }
  }

  ProductModel.find(query, null, {}, function (err, items) {
    res.send(items)
  })
})
