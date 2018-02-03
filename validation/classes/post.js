const main = require('../index')
const LanguageDetect = require('languagedetect')
const lngDetector = new LanguageDetect()
const steem = require('../../components/steem')

module.exports = class extends main {
    constructor (deposit, config, post) {
        super(deposit, config)

		this.post = post
    }

    checkImages (resolve, reject) {
        return typeof this.post.metadata.image !== 'undefined' ? resolve() : reject('Post misses image')
    }

    checkComments (resolve, reject) {
        return ! this.post.replies.includes('cheetah', 'steemcleaners') ? resolve() : reject('Upvoted by other helpers already')
    }

    checkLength (resolve, reject) {
        return this.post.content.length > this.config.minCharacters ? resolve() : reject('Post not long enough')
    }

    checkEnglish (resolve, reject) {
        return lngDetector.detect(this.post.content)[0][0] === 'english' ? resolve() : reject('Post not in English')
    }

}
