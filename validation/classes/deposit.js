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
        console.log(this.deposit.data.from)
		this.keystone.list('BotCustomers').model.findOne({
			username: this.deposit.data.from
		}).exec( (err, doc) => {
            console.log(err, doc)
			if (doc) {
				const minTime = formatSeconds(new Date()) - this.config.minSeconds
                console.log(minTime)
				const lastUpvote = formatSeconds(doc.lastUpvote)
                console.log(lastUpvote)
				lastUpvote < minTime ? resolve() : reject('Upvoting too much, wait: ' + secondsToHms(lastUpvote - minTime) )
			} else {
                console.log('not found')
				resolve()
			}
		})
    }
}

function formatSeconds (date) {
	return date.getTime() / 1000
}

function parseNumber (i) {
	return Number( i.split(' ')[0] )
}
function secondsToHms(d) {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);

        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return hDisplay + mDisplay + sDisplay; 
}

