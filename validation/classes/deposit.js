const main = require('../index')
const steem = require('steem')

module.exports = class extends main {
    constructor(deposit, config, keystone) {
        super(deposit, config)

		this.keystone = keystone
		
        this.getContent()
		this.getLastUpvote()
    }
	
    getLastUpvote () {
    	this.keystone.list('BotCustomers').model.findOne({
			username: this.deposit.data.username
		}).exec( (err, doc) => {
			if (!doc == null)
				this.lastUpvote = formatSeconds(doc.lastUpvote)
			else 
				this.lastUpvote = false
		})
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
        return ! this.lastUpvote < ( formatSeconds(new Date()) - this.config.minSeconds ) ? resolve() : reject('Upvoting too much')
    }
}

function formatSeconds (date) {
	return ~~date.getTime() / 1000
}

function parseNumber (i) {
	return Number( i.split(' ')[0] )
}
