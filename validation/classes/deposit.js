const main = require('../index')
const steem = require('steem')

module.exports = class extends main {
    constructor(deposit, config, keystone) {
        super(deposit, config)

		this.keystone = keystone
		
        this.getContent()
    }
    
	
    getContent() {
        steem.api.getContent(this.post.author, this.post.permlink, (err, res) => {
            this.post.metadata = JSON.parse(res.json_metadata)
            this.post.content = res.body
            this.post.replies = res.replies
        })
    }
    
    isNotBlacklisted (resolve, reject) {
    	return this.config.blacklist.includes( this.deposit.data.username ) ? reject('User Blacklisted') : resolve()
	}
    
    isCorrectAmount (resolve, reject) {
    	return parseNumber(this.deposit.data.amount) === this.config.bidAmount ? resolve() : reject('Wrong amount sent')
	}

    lastUpvoteWithinAllowed (resolve, reject){
		this.keystone.list('BotCustomers').model.findOne({
			username: this.deposit.data.username
		}).exec( (err, doc) => {
			if (!doc == null)
				const lastUpvote = formatSeconds(doc.lastUpvote)
				lastUpvote > minTime ? resolve() : reject('Upvoting too much, wait '+ ( lastUpvote - minTime ) + 'seconds')

		else
			resolve()
		})
    }
}

function formatSeconds (date) {
	return ~~date.getTime() / 1000
}

function parseNumber (i) {
	return Number( i.split(' ')[0] )
}
