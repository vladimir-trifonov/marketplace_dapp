const marketplaceArtifacts = require('./build/contracts/Marketplace.json')
const contract = require('truffle-contract')
const Web3 = require('web3')
const cors = require('cors')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const Marketplace = contract(marketplaceArtifacts)
const helmet = require('helmet')
Marketplace.setProvider(provider)

// Setup mongo
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const ProductModel = require('./product')
mongoose.connect('mongodb://localhost:27017/marketplace_dapp')
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(helmet())
app.use(cors())

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`)
})

function setupProductEventListners() {
  Marketplace.deployed().then((contract) => {
    contract.NewProduct({ fromBlock: 0, toBlock: 'latest' })
      .watch((err, result) => {
        if (err) {
          return console.log(err)
        }
        saveProduct(result.args)
      })

    contract.ProductSold({ fromBlock: 0, toBlock: 'latest' })
      .watch((err, result) => {
        if (err) {
          return console.log(err)
        }
        updateProduct(result.args)
      })
  })
}

setupProductEventListners()

function saveProduct(product) {
  ProductModel.findOne({ 'blockchainId': product._productId.toLocaleString() }, (err, dbProduct) => {
    if (err) {
      return console.log(err)
    }

    if (dbProduct != null) {
      return
    }

    const newProduct = new ProductModel({
      name: product._name,
      blockchainId: product._productId,
      category: product._category,
      ipfsImageHash: product._imageLink,
      ipfsDescHash: product._descLink,
      price: product._price,
      condition: product._productCondition,
      status: 0
    })

    newProduct.save((err) => {
      if (err) {
        return console.log(err)
      }

      ProductModel.count({}, (err, count) => {
        if (err) {
          return console.error(err)
        }

        console.log('Products count: ' + count)
      })
    })
  })
}

function updateProduct(product) {
  ProductModel.findOne({ blockchainId: product._productId.toLocaleString() }, (err, updated) => {
    updated.status = product._status.toNumber()

    updated.save((err) => {
      if (err) {
        return console.error(err)
      }
    })
  })
}

app.get('/products', function (req, res) {
  const query = { }

  if (req.query.category !== undefined) {
    query['category'] = { $eq: req.query.category }
  } else if (req.query.status !== undefined) {
    if (req.query.status === 'Unsold') {
      query['status'] = { $eq: 0 }
    } else if (req.query.status === 'Sold') {
      query['status'] = { $eq: 1 }
    }
  }

  ProductModel.find(query, null, {}, (err, items) => {
    if (err) {
      return console.log(err)
    }

    res.send(items)
  })
})
