module.exports = class {
    constructor (deposit, keystone, config) {
        this.deposit = deposit
		this.keystone = keystone
		this.config = config
    }
	
	logLastUpvote () {
    	this.keystone.list('BotCustomers').model.findOneAndUpdate({
			username: this.deposit.data.from
		}, {
    		username: this.deposit.data.from,
			lastUpvote: new Date()	
    		}, 
		{
    		upsert: true,
			new: true
		}, (err, doc) => {
    		
		})
	}
	
	logUpvote (id) {
		this.keystone.list('BotPosts').model.findOneAndUpdate({
				url: this.deposit.data.memo
			}, {
				url: this.deposit.data.memo,
				upvotedBy: id,
				reported: false
			},
			{
				upsert: true,
				new: true
			}, (err, doc) => {
				console.log(doc)
			})	
    }
	
	createComment() {
    	this.deposit.res.commentOnMemo( this.config.commentMessage + ' Requested by @'+this.deposit.data.from )
	}

	doUpvote () {
    	this.deposit.res.upvoteOnMemo( this.config.votePercentage )
	}
}
