module.exports = (Marketplace, ProductModel) => {
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
}