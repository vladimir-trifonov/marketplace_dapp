/* global web3, $, URLSearchParams */
import '../stylesheets/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import marketplaceArtifacts from '../../build/contracts/Marketplace.json'

var Marketplace = contract(marketplaceArtifacts)

const ipfsAPI = require('ipfs-api')

const ipfs = ipfsAPI({ host: 'localhost', port: '5001', protocol: 'http' })

let App = window.App = {
  start: function () {
    var reader

    Marketplace.setProvider(web3.currentProvider)
    renderStore()

    $('#product-image').change(function (event) {
      const file = event.target.files[0]
      reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
    })

    $('#add-item-to-store').submit(function (event) {
      event.preventDefault()
      const req = $('#add-item-to-store').serialize()
      let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
      let decodedParams = {}
      Object.keys(params).forEach(function (v) {
        decodedParams[v] = decodeURIComponent(decodeURI(params[v]))
      })
      saveProduct(reader, decodedParams)
    })

    if ($('#product-details').length > 0) {
      // This is product details page
      let productId = new URLSearchParams(window.location.search).get('id')
      renderProductDetails(productId)
    }

    $('#buy').submit(function (event) {
      event.preventDefault()
      let amount = $('#amount').val()
      let productId = $('#product-id').val()
      Marketplace.deployed().then(function (i) {
        i.buy(parseInt(productId), { value: web3.toWei(amount), from: web3.eth.accounts[1], gas: 440000 }).then(
          function (f) {
            // Redirect
          }
        )
      })
    })
  }
}

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
  }

  App.start()
})

function renderStore () {
  Marketplace.deployed().then(function (i) {
    i.getProduct.call(1).then(function (p) {
      $('#product-list').append(buildProduct(p))
    })
    i.getProduct.call(2).then(function (p) {
      $('#product-list').append(buildProduct(p))
    })
  })
}

function buildProduct (product) {
  let node = $(`<div class="block">
  <a href="product.html?id=${product[0]}" target="_blank" class="details">
    <div class="top">
      <img src="https://ipfs.io/ipfs/${product[3]}" alt="pic" />
    </div>
    
    <div class="bottom">
      <div class="heading">${product[1]}</div>
      <div class="price">${displayPrice(product[5])}</div>
    </div>
  </a>
</div>`)
  return node
}

function saveImageOnIpfs (reader) {
  return new Promise(function (resolve, reject) {
    const buffer = Buffer.from(reader.result)
    ipfs.add(buffer)
      .then((response) => {
        console.log(response)
        resolve(response[0].hash)
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
  })
}

function saveTextBlobOnIpfs (blob) {
  return new Promise(function (resolve, reject) {
    const descBuffer = Buffer.from(blob, 'utf-8')
    ipfs.add(descBuffer)
      .then((response) => {
        console.log(response)
        resolve(response[0].hash)
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
  })
}

function saveProduct (reader, decodedParams) {
  let imageId, descId
  saveImageOnIpfs(reader).then(function (id) {
    imageId = id
    saveTextBlobOnIpfs(decodedParams['product-description']).then(function (id) {
      descId = id
      saveProductToBlockchain(decodedParams, imageId, descId)
    })
  })
}

function saveProductToBlockchain (params, imageId, descId) {
  Marketplace.deployed().then(function (i) {
    i.addProductToStore(params['product-name'], params['product-category'], imageId, descId, web3.toWei(params['product-price'], 'ether'), params['seller-address'], params['seller-contacts'], parseInt(params['product-condition']), { from: web3.eth.accounts[0], gas: 440000 }).then(function (f) {
      $('#msg').show()
      $('#msg').html('Your product was successfully added to your store!')
    })
  })
}

function renderProductDetails (productId) {
  Marketplace.deployed().then(function (i) {
    i.getProduct.call(productId).then(function (p) {
      let content = ''
      ipfs.cat(p[4]).then(function (file) {
        content = file.toString()
        $('#product-desc').append('<div>' + content + '</div>')
      })

      $('.item-photo').append("<img src='https://ipfs.io/ipfs/" + p[3] + "' width='250px' />")
      $('#product-price').html(displayPrice(p[5]))
      $('#amount').val(p[5])
      $('#product-name').html(p[1])
      $('#product-id').val(p[0])
    })
  })
}

function displayPrice (amt) {
  return 'Ξ' + web3.fromWei(amt, 'ether')
}

