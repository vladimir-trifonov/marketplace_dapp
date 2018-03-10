
const contract = require('truffle-contract')
const Web3 = require('web3')
const cors = require('cors')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const ctrl = require('./ctrl')

// Contract
const marketplaceArtifacts = require('../build/contracts/Marketplace.json')
const Marketplace = contract(marketplaceArtifacts)
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
Marketplace.setProvider(provider)

// Setup mongo
require('./mongodb')('mongodb://localhost:27017/marketplace_dapp')
const ProductModel = require('./product')

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const ipfsAPI = require('ipfs-api')
const ipfs = ipfsAPI({ host: 'localhost', port: '5001', protocol: 'http' })

// Security
app.use(helmet())
// CORS
app.use(cors())
// Parse body
app.use(bodyParser.json())

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}!`)
})

// APIs
require('./contract')(Marketplace, ProductModel)
app.get('/products', ctrl.getProducts(ProductModel))
app.post('/ipfs', ctrl.uploadToIpfs(ipfs))
app.get('/ipfs/:hash', ctrl.catIpfs(ipfs))
