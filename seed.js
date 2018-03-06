Eutil = require('ethereumjs-util')
Marketplace = artifacts.require("./Marketplace.sol")
module.exports = function (callback) {
  amt_1 = web3.toWei(1, 'ether')
  Marketplace.deployed().then(function (i) { i.addProductToStore('iphone 5', 'Cell Phones & Accessories', 'QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', 2*amt_1, '0x9Ce7b5661717bdcE718bE554f218605e017B7c51', 'Sofia').then(function (f) { console.log(f) }) })
  Marketplace.deployed().then(function (i) { i.addProductToStore('iphone 5s', 'Cell Phones & Accessories', 'QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', 3*amt_1, '0x9Ce7b5661717bdcE718bE554f218605e017B7c51', 'Sofia').then(function (f) { console.log(f) }) })
  Marketplace.deployed().then(function (i) { i.addProductToStore('iphone 6', 'Cell Phones & Accessories', 'QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', amt_1, '0x9Ce7b5661717bdcE718bE554f218605e017B7c51', 'Sofia').then(function (f) { console.log(f) }) })
  Marketplace.deployed().then(function (i) { i.addProductToStore('iphone 6s', 'Cell Phones & Accessories', 'QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', 4*amt_1, '0x9Ce7b5661717bdcE718bE554f218605e017B7c51', 'Sofia').then(function (f) { console.log(f) }) })
  Marketplace.deployed().then(function (i) { i.addProductToStore('iphone 7', 'Cell Phones & Accessories', 'QmStqeYPDCTbgKGUwns2nZixC5dBDactoCe1FB8htpmrt1', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', 5*amt_1, '0x9Ce7b5661717bdcE718bE554f218605e017B7c51', 'Sofia').then(function (f) { console.log(f) }) })
  Marketplace.deployed().then(function (i) { i.addProductToStore('Jeans', 'Clothing, Shoes & Accessories', 'QmZwfUuHwBhwshGfo4HEvvvZwcdrppas156uNRxEVU3VYr', 'QmbLRFj5U6UGTy3o9Zt8jEnVDuAw2GKzvrrv3RED9wyGRk', 5*amt_1, '0x9Ce7b5661717bdcE718bE554f218605e017B7c51', 'Sofia').then(function (f) { console.log(f) }) })
  Marketplace.deployed().then(function (i) { i.productIndex.call().then(function (f) { console.log(f) }) })
}
