const main = require('../index')
const LanguageDetect = require('languagedetect')
const lngDetector = new LanguageDetect()
const steem = require('../../components/steem')

module.exports = class extends main {
    constructor (deposit, config, callback) {
        super(deposit, config)

		steem.api.getContent(this.post.author, this.post.permlink, (err, res) => {

			this.post.metadata = JSON.parse( res.json_metadata )
			this.post.content = res.body
			this.post.replies = res.replies.map( (i) => i.author )

			callback()
		})
    }

    checkImages () {
        return typeof this.post.metadata.image !== 'undefined'
    }

    checkComments () {
        return ! this.post.replies.includes('cheetah', 'steemcleaners')
    }

    checkLength () {
        return this.post.content.length > this.config.minCharacters
    }

    checkEnglish () {
        return lngDetector.detect(this.post.content)[0][0] === 'english'
    }

}
