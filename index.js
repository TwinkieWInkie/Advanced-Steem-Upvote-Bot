const SteemBot = require('steem-bot').default
const keystone = require('./components/keystone')
const CronJob = require('cron').CronJob

const Settings = require('./components/settings.js')

const ValidateDeposit = require('./validation/classes/deposit')
const ValidatePost = require('./validation/classes/post')
const ValidateUser = require('./validation/classes/user')

const Refund = require('./actions/refund')
const Upvote = require('./actions/upvote')

const settings = new Settings(keystone)

settings.getConfigs((config) => {
	const username = config.username
	const postingKey = config.postingKey
	const activeKey = config.activeKey
	
	const bot = new SteemBot({
		username,
		postingKey,
		activeKey
	})
	console.log('Starting listner for:' +config.username)
	
	var i = 0
	
	bot.onDeposit(
		[config.username],
		(data, res) => {
			console.log('received')
			
			
			if (typeof config.whiteList !== 'undefined') {
				if (config.whiteList.includes(data.from)) {
					config.bidAmount = config.whiteListBid
					config.votePercentage = config.whiteListPercentage
				}
			}
			if (typeof config.goldList !== 'undefined') {
				if (config.goldList.includes(data.from)) {
					config.bidAmount = config.goldListBid
					config.votePercentage = config.goldListPercentage
				}
			}
			
			
			const deposit = {data, res}
			const refund = new Refund(deposit)

			if ( ! isSteemitLink(data.memo) )
				return refund.doRefund()
			
			const depositValidator = new ValidateDeposit(deposit, config, keystone)
			
			depositValidator.checks.push(
				depositValidator.isCorrectAmount(),
				depositValidator.isNotBlacklisted(),
				depositValidator.lastUpvoteWithinAllowed(),
			)
			
			if (depositValidator.check() === false)
				return refund.doRefund()

			const postValidator = new ValidatePost(deposit, config, () => {
				postValidator.checks.push(
					postValidator.checkComments(),
					postValidator.checkLength(),
					postValidator.checkImages(),
					postValidator.checkEnglish(),
				)

				if (postValidator.check() === false)
					return refund.doRefund()


				const userValidator = new ValidateUser(deposit, config, () => {

					console.log('pre userValidator')

					userValidator.checks.push(
						userValidator.checkPowerDowns(),
						userValidator.checkAccountValue()
					)

					if (userValidator.check() === false)
						return refund.doRefund()

					const upvote = new Upvote(deposit, keystone, settings)
					
					upvote.logLastUpvote()
					upvote.logUpvote(config._id)
					upvote.createComment()
					upvote.doUpvote(i)
					i++
				})
			})
		}
	)

	bot.start()
	
	new CronJob('0 */12 * * *', function () {
		keystone.list('BotPosts').find({
			reported: false,
			upvotedBy: config._id
		}).lean().exec( (err, docs) => {
			docs.forEach( (i) => {
				i.reported = true
				i.save()
			})
			
			post(
				config.username,
				config.postingKey,
				config.reportMainTag,
				config.reportTitle + ' ' + new Date().toLocaleDateString('en-US'),
				config.reportMessage + '\n' +
				+ map(i => i.url).join('\n'),
				{ tags: config.reportTags }
			)
			
		})
	}, true)
})

function isSteemitLink (memo) {
	return memo.indexOf('steemit.com') > -1
}

/**
 * Creates an account, note that almost no validation is done.
 * @param {String} username - username of the account
 * @param {String} password - password of the account
 * @param {String} main_tag - The main tag for the post
 * @param {String} title - Title of the post
 * @param {String} body - body (content) of the post.
 * @param {object} [jsonMetadata] - dictionnary with additional tags, app name, etc,
 * @param {String} [permlink] - permanent link, by default it's the date + -post. eg : 20171237t122520625z-post
 */
function post(username, password, main_tag, title, body, jsonMetadata, permlink) {
	var wif = steem.auth.toWif(username, password, 'posting');
	// By default permlink will be the date
	permlink = permlink || new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
	jsonMetadata = jsonMetadata || {};

	steem.broadcast.comment(wif, '',  main_tag, username, permlink + '-post', title, body, jsonMetadata, function (err, result) {
		console.log(err, result);
	});
}
