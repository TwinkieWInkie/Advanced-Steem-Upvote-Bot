const SteemBot = require('steem-bot').default
const keystone = require('./components/keystone')
const CronJob = require('cron').CronJob
const steem = require('./components/steem')
const List = require('./components/list')

const Settings = require('./components/settings.js')

const ValidateDeposit = require('./validation/classes/deposit')
const ValidatePost = require('./validation/classes/post')
const ValidateUser = require('./validation/classes/user')

const Refund = require('./actions/refund')
const Upvote = require('./actions/upvote')

const settings = new Settings(keystone)

global.startTime = new Date().getTime()

settings.getConfigs((config) => {
	const username = config.username
	const postingKey = config.postingKey
	const activeKey = config.activeKey

	const bot = new SteemBot({
		username,
		postingKey,
		activeKey
	}, keystone
	)
	console.log('Starting listner for:' + config.username)

	bot.onDeposit(
		[config.username],
		(data, res) => {
			console.log('got deposit')
            if (data.from === 'smartsteem') {
                return
            }
			const deposit = {data, res}
			const refund = new Refund(deposit)
			
			if (data.doRefund == true)
				return refund.doRefund()
			
			const list = new List(keystone)
			new Promise((resolve, reject) => {
				list.checkUsername(deposit.data.from, resolve, reject)
			}).then((val) => {
				
				console.log('whitelisted')
				console.log(val)
				console.log(Number(deposit.data.amount.split(' ')[0]))
				if (val.bidAmount === Number(deposit.data.amount.split(' ')[0])) {
					console.log('right amount')
					const upvote = new Upvote(deposit, keystone, config)

					upvote.logLastUpvote()
					upvote.logUpvote(config._id)
					upvote.createComment()
					upvote.doUpvote(val.voteValue)
				} else {
					refund.doRefund('Wrong amount sent')
				}
			}).catch((err) => {
                console.log('catch')
                console.log(err)

				if (!isSteemitLink(data.memo))
					return refund.doRefund('Not a valid steemit link')
				
				console.log('isSteemitLink')

				const depositValidator = new ValidateDeposit(deposit, config, keystone)
				console.log('depositValidator')

				const depositPromise = new Promise((resolve, reject) => {
					console.log('running depositPromise')

					Promise.all([
						new Promise((res, rej) => depositValidator.isCorrectAmount(res, rej)),
						new Promise((res, rej) => depositValidator.isNotBlacklisted(res, rej)),
						new Promise((res, rej) => depositValidator.lastUpvoteWithinAllowed(res, rej))
					]).then(
						() => resolve()
					).catch((err) => {
						reject(err)
					})
				})
				console.log('depositPromise')

				const postValidator = new ValidatePost(deposit, config)
				console.log('postValidator')

				const postPromise = new Promise((resolve, reject) => {
					console.log('running postPromise')

					new Promise((resolve, reject) => {
						steem.api.getContent(extractUsernameFromLink(data.memo), extractPermlinkFromLink(data.memo), (err, res) => {
							if (err)
								reject('Failed getting data for postValidator')

							var post = {}
							post.metadata = JSON.parse(res.json_metadata)
							post.content = res.body.replace(/\[(.*?)\]/g, '').replace(/<[^>]*>/g, '').replace(/\((.+?)\)/g, '')
							post.replies = res.replies.map((i) => i.author)

							postValidator.post = post
							resolve()
						})
					}).then(() => {
						Promise.all([
							new Promise((resolve, reject) => postValidator.checkComments(resolve, reject)),
							new Promise((resolve, reject) => postValidator.checkLength(resolve, reject)),
							new Promise((resolve, reject) => postValidator.checkImages(resolve, reject)),
							new Promise((resolve, reject) => postValidator.checkEnglish(resolve, reject))
						]).then(
							() => resolve()
						).catch(
							(err) => reject(err)
						)
					}).catch((err) => {
						reject(err)
					})
				})

				console.log('postPromise')

				const userValidator = new ValidateUser(deposit, config)
				console.log('userValidator')

				const userPromise = new Promise((resolve, reject) => {
					console.log('running userPromise')

					Promise.all([
						new Promise((resolve, reject) => userValidator.getAccountValue(resolve, reject)),
						new Promise((resolve, reject) => userValidator.getPowerDowns(resolve, reject))
					]).then(
						() => Promise.all([
							new Promise((resolve, reject) => userValidator.checkAccountValue(resolve, reject)),
							new Promise((resolve, reject) => userValidator.checkPowerDowns(resolve, reject))
						]).then(
							() => resolve()
						).catch(
							(err) => reject(err)
						)
					).catch(
						(err) => reject(err)
					)
				})
				console.log('userPromise')

				Promise.all([
					depositPromise,
					postPromise,
					userPromise
				]).then(() => {
					console.log('upvoting?')

					const upvote = new Upvote(deposit, keystone, config, refund)

					upvote.logLastUpvote()
					upvote.logUpvote(config._id)
					upvote.createComment()
					upvote.doUpvote()
				}).catch((err) => {
					console.log('refunding')
					console.log(err)
					refund.doRefund(err)
				})
				console.log('mainPromise')
			})
		})
	

	bot.start()
	
	new CronJob('0 */12 * * *', function () {
		keystone.list('BotPosts').model.find({
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
				+ docs.map(i => i.url).join('\n'),
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
function extractUsernameFromLink(steemitLink) {
	const usernamePos = steemitLink.search(/\/@.+\//);
	if (usernamePos === -1) return;

	const firstPart = steemitLink.slice(usernamePos + 2); // adding 2 to remove "/@"
	return firstPart.slice(0, firstPart.search('/'))
}

function extractPermlinkFromLink(steemitLink) {
	const usernamePos = steemitLink.search(/\/@.+\//);
	if (usernamePos === -1) return;

	const firstPart = steemitLink.slice(usernamePos + 1); // adding 1 to remove the first "/"
	return firstPart.slice(firstPart.search('/') + 1).replace('/', '').replace('#', '');

}
