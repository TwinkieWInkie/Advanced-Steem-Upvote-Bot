const SteemBot = require('steem-bot').default

const validateDeposit = require('./validation/classes/deposit')
const validatePost = require('./validation/classes/post')

const refund = require('actions/refund')
const upvote = require('actions/upvote')

const username = 'bla'
const postingKey = 'bla'

const bot = new SteemBot({username, postingKey})

bot.onDeposit(
    username,
    (data, res) => {
        const settings = new settings(config)
        const deposit = new depositHandler(data, res)
        const depositValidator = new validateDeposit(deposit, settings)
        const postValidator = new validatePost(deposit, settings)
        const refund = new refund(deposit)

        depositValidator.checks.push(
            depositValidator.isCorrectAmount(),
            depositValidator.isSteemitLink(),
            depositValidator.lastUpvoteWithinAllowed()
        )

        if (depositValidator.check() === false)
            return refund.doRefund()

        postValidator.checks.push(
            postValidator.checkComments(),
            postValidator.checkImages(),
            postValidator.checkEnglish(),
            postValidator.checkLength()
        )

        if (postValidator.check() === false)
            return refund.doRefund
    }
)

bot.start()
