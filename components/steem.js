const steem = require('steem')

//steem.api.setOptions({ url: 'https://api.steemit.com' })
steem.api.setOptions({ url: 'https://rpc.buildteam.io' });
module.exports = steem
