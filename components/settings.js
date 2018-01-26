const config = {
    bid: {
        amount: 0.05
    },
    bot: {
        upvote: 10
    },
    blacklist: ['user1', 'user2']
}

 module.exports = {
    constructor (config) {
        this.bid = config.bid
        this.blacklist = config.blacklist
        this.bot = config.bot
    }
}