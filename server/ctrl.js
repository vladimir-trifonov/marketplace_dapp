module.exports.getProducts = (ProductModel) => {
  return function (req, res) {
    const query = {}

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
  }
}

module.exports.uploadToIpfs = (ipfs) => {
  return (req, res) => {
    const buffer = Buffer.from(req.body.buffer)
    ipfs.add(buffer)
      .then((response) => {
        res.send({ hash: response[0].hash })
      }).catch((err) => {
        console.log(err)
        res.sendStatus(500)
      })
  }
}

module.exports.catIpfs = (ipfs) => {
  return (req, res) => {
    ipfs.cat(req.params.hash).then(function (file) {
      res.send({ file: file.toString() })
    })
  }
}
