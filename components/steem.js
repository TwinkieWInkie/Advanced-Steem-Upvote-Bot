const steem = require('steem')

steem.api.setOptions({ url: 'https://api.steemit.com' })

module.exports = steem