const SteemBot = require('steem-bot').default
const keystone = require('./components/keystone')


const ValidateDeposit = require('./validation/classes/deposit')
const ValidatePost = require('./validation/classes/post')

const Refund = require('./actions/refund')
const Upvote = require('./actions/upvote')

const username = 'bla'
const postingKey = 'bla'

const bot = new SteemBot({username, postingKey})

bot.onDeposit(
    username,
    (data, res) => {
        const deposit = {data, res}
        const settings = new settings(config)
        const depositValidator = new DepositValidator(deposit, settings)
        const postValidator = new PostValidator(deposit, settings)
        const refund = new Refund(deposit)

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
            return refund.doRefund()
    }
)

bot.start()
