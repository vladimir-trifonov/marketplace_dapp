/* global web3, $, URLSearchParams, location, alert */
import '../stylesheets/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import marketplaceArtifacts from '../../build/contracts/Marketplace.json'
const offchainServer = 'http://localhost:3000'

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
      let productId = new URLSearchParams(window.location.search).get('id')
      let buyerContact = $('#buyer-contact').val()
      Marketplace.deployed().then(function (contract) {
        contract.buy(parseInt(productId), buyerContact, { value: amount, from: web3.eth.accounts[0], gas: 1000000 }).then(
          function (f) {
            $('#msg').show()
            $('#msg').html('Your successfully bought this product!')
            setTimeout(() => {
              location.reload()
            }, 1000)
          }
        )
      })
    })

    $('#release-funds').click(function (event) {
      event.preventDefault()
      let productId = new URLSearchParams(window.location.search).get('id')
      Marketplace.deployed().then(function (f) {
        $('#msg').html('Your transaction has been submitted. Please wait for few seconds for the confirmation').show()
        f.releaseAmountToSeller(productId, { from: web3.eth.accounts[0], gas: 100000 }).then(function (f) {
          location.reload()
        }).catch(alert)
      })
    })

    $('#refund-funds').click(function (event) {
      event.preventDefault()
      let productId = new URLSearchParams(window.location.search).get('id')
      Marketplace.deployed().then(function (f) {
        $('#msg').html('Your transaction has been submitted. Please wait for few seconds for the confirmation').show()
        f.refundAmountToBuyer(productId, { from: web3.eth.accounts[0], gas: 100000 }).then(function (f) {
          location.reload()
        }).catch(function (e) {
          alert(e)
        })
      })

      alert('Are you sure, do you want to refund the funds?')
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

function renderProducts(div, filters) {
  $.ajax({
    url: offchainServer + '/products',
    type: 'get',
    contentType: 'application/json charset=utf-8',
    data: filters
  }).done(function (data) {
    if (data.length === 0) {
      $('#' + div).html('No products found')
    } else {
      $('#' + div).html('')
    }
    while (data.length > 0) {
      let chunks = data.splice(0, 4)
      let row = $('<div/>')
      row.addClass('row')
      chunks.forEach(function (value) {
        let node = buildProduct(value)
        row.append(node)
      })
      $('#' + div).append(row)
    }
  })
}

function renderStore() {
  if ($('#product-list').length > 0) {
    renderProducts('product-list')
  }
}

function buildProduct(product) {
  let node = $(`<div class="block">
  <a href="product.html?id=${product.blockchainId}" target="_blank" class="details">
    <div class="top">
      <img src="https://ipfs.io/ipfs/${product.ipfsImageHash}" alt="pic" />
    </div>
    
    <div class="bottom">
      <div class="heading">${product.name}</div>
      ${product.status ? '<h3 style="color: red;">SOLD</h3>' : `<div class="price">${displayPrice(product.price)}</div>`}
    </div>
  </a>
</div>`)
  return node
}

function saveImageOnIpfs(reader) {
  return new Promise(function (resolve, reject) {
    const buffer = Buffer.from(reader.result)
    ipfs.add(buffer)
      .then((response) => {
        console.log(response)
        resolve(response[0].hash)
      }).catch((err) => {
        alert(err)
        reject(err)
      })
  })
}

function saveTextBlobOnIpfs(blob) {
  return new Promise(function (resolve, reject) {
    const descBuffer = Buffer.from(blob, 'utf-8')
    ipfs.add(descBuffer)
      .then((response) => {
        console.log(response)
        resolve(response[0].hash)
      }).catch((err) => {
        alert(err)
        reject(err)
      })
  })
}

function saveProduct(reader, decodedParams) {
  let imageId, descId
  saveImageOnIpfs(reader).then(function (id) {
    imageId = id
    saveTextBlobOnIpfs(decodedParams['product-description']).then(function (id) {
      descId = id
      saveProductToBlockchain(decodedParams, imageId, descId)
    })
  })
}

function saveProductToBlockchain(params, imageId, descId) {
  Marketplace.deployed().then(function (contract) {
    const price = parseInt(web3.toWei(params['product-price'], 'ether'))
    const value = (price * 95) / 100
    const commision = (price * 5) / 100
    contract.addProductToStore(
      params['product-name'],
      params['product-category'],
      imageId,
      descId,
      price + '',
      params['seller-contacts'],
      parseInt(params['product-condition']),
      value + '',
      commision + '',
      { from: web3.eth.accounts[0], gas: 1000000 }).then(function (f) {
        $('#msg').show()
        $('#msg').html('Your product was successfully added to your store!')
        document.getElementById('add-item-to-store').reset()
        window.location.href = '/'
      }).catch(alert)
  }).catch(alert)
}

function renderProductDetails(productId) {
  Marketplace.deployed().then(function (contract) {
    contract.getProduct.call(productId).then(function (product) {
      let content = ''
      ipfs.cat(product[4]).then(function (file) {
        content = file.toString()
        $('#product-desc').append('<div>' + content + '</div>')
      })
        .catch(alert)

      $('.item-photo').append("<img src='https://ipfs.io/ipfs/" + product[3] + "' width='250px' />")
      $('#product-price').html(displayPrice(product[5]))
      $('#amount').val(product[5])
      $('#product-name').html(product[1])
      $('#product-id').val(product[0])
      if (product[6].toNumber() === 1) {
        contract.escrowInfo.call(productId).then(function (f) {
          if (!!f[3] === true) {
            // Finalized
            $('#buy').hide()
            $('#sold').hide()
            $('#finalized').show()
          } else {
            // Sold
            $('#buy').hide()
            $('#sold').show()
            $('#finalized').hide()
          }
        }).catch(alert)
      } else {
        // Unsold
        $('#sold').hide()
        $('#buy').show()
        $('#finalized').hide()
      }
    })
      .catch(alert)
  })
}

function displayPrice(amt) {
  return 'Ξ' + web3.fromWei(amt, 'ether')
}

