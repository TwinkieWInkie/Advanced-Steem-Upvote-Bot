const main = require('../index.js')
const Crawler = require('crawler')
const crawler = new Crawler()
const axios = require('axios')

module.exports = class extends main {
    constructor (deposit, config) {
        super(deposit, config)
		
		this.powerDowns = []
    }
    
    getAccountValue (resolve, reject) {
    	crawler.direct({ //this.deposit.data.username
			uri: 'https://steemit.com/@'+this.deposit.data.username+'/transfers',
			callback: (err, res) => {
				if (err)
					return reject('Unable to get account value')
				
				const $ = res.$
				this.value = ~~ Number( $('.UserWallet__balance:nth-of-type(6) > .column:nth-of-type(2)')
					.text()
					.replace(/[^0-9.]/, '')
				)
				resolve()
			}
		})
	}
    
    getPowerDowns (resolve, reject) {
    	console.log('started getPowerDowns')
    	axios.get('https://uploadbeta.com/api/steemit/transfer-history/?id='+ this.deposit.data.username)
			.then( (results) => {
				console.log(results.data)
				this.powerDowns = results.data.filter(transfer => transfer.transaction.includes('power down'))
				console.log(this.powerDowns)
				resolve()
			})
			.catch( (err) => reject(err))
	}
	
	checkAccountValue (resolve, reject) {
    	return this.value <= 2000 ? resolve() : reject('Account value over 2000')
	}
    
    checkPowerDowns (resolve, reject) {
    	return this.powerDowns.length <= 0 ? resolve() : reject('User has a power down history')
	} 
}
