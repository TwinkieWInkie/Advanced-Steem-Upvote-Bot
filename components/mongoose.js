const mongoose = require('components/mongoose')

mongoose.connect('mongodb://localhost/steemponzi')

module.exports = mongoose