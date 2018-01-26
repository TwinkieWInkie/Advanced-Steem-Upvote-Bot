const main = require('../index')

module.exports = class extends main {
    constructor(deposit, settings) {
        super(deposit, settings)

        // I write my code like I live, no promises
        this.getContent()
        this.checkComments()
    }

    getContent() {
        steem.api.getContent(this.post.author, this.post.permlink, (err, res) => {
            this.post.metadata = JSON.parse(res.json.metadata)
            this.post.content = res.body
            this.post.replies = res.replies
        })
    }

    isSteemitLink () {
        return this.data.memo.indexOf('steemit.com') > -1
    }

    lastUpvoteWithinAllowed () {
        return true
        //TODO: Keep record of recent requests, check them here
    }
}