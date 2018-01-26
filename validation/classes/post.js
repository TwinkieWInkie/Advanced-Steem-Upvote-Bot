const main = require('../index')
const LanguageDetect = require('languagedetect')
const lngDetector = new LanguageDetect()
const steem = require('../../components/steem')

module.exports = class extends main {
    constructor (deposit, settings) {
        super(deposit, settings)

        // I write my code like I live, no promises
        this.getContent()
        this.checkComments()
    }

    getContent () {
        steem.api.getContent(this.post.author, this.post.permlink, (err, res) => {
            this.post.metadata = JSON.parse( res.json.metadata )
            this.post.content = res.body
            this.post.replies = res.replies
        })
    }

    checkImages () {
        return typeof this.post.metadata.image !== 'undefined'
    }

    checkComments () {
        return this.post.replies.map( (i) => i.author ).includes('cheetah', 'steemcleaners')
    }

    checkLength () {
        //TODO
    }

    checkEnglish () {
        return lngDetector.detect(this.post.content)[0][0] === 'english'
    }

}