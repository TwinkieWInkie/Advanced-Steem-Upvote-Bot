const main = require('../index.js')
const Crawler = require('crawler')
const crawler = new Crawler()
const axios = require('axios')

module.exports = class extends main {
    constructor (deposit, config, callback) {
        super(deposit, config)
		
		this.callback = callback
		this.powerDowns = []
		this.getPowerDowns()
		this.getAccountValue()
    }
    
    getAccountValue () {
    	crawler.direct({ //this.deposit.data.username
			uri: 'https://steemit.com/@'+this.deposit.data.username+'/transfers',
			callback: (err, res) => {
				if (err)
					return console.log(err)
				
				const $ = res.$
				this.value = ~~ Number( $('.UserWallet__balance:nth-of-type(6) > .column:nth-of-type(2)')
					.text()
					.replace(/[^0-9.]/, '')
				)	
			}
		})
	}
    
    getPowerDowns () {
    	console.log('started getPowerDowns')
    	axios.get('https://uploadbeta.com/api/steemit/transfer-history/?id='+ this.deposit.data.username)
			.then( (results) => {
				this.powerDowns = results.data.filter(transfer => transfer.transaction.includes('power down'))
				this.callback()
			})
	}
	
	checkAccountValue () {
    	return this.value <= 2000
	}
    
    checkPowerDowns () {
    	return this.powerDowns.length <= 0
	}
}
