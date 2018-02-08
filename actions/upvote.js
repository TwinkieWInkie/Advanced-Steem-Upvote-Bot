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
		everthing(this.config.username).then((votePart) => {
			let votePower = ~~ Number(this.config.voteValue) / Number(votePart) * 100
			if (votePower > 100) votePower = 100

			this.deposit.res.upvoteOnMemo(votePower)

		})
	}
}
// This is written via async / await but can be easily transformed to promises
// It also uses dsteem - but the same functions are available in steem-js. Take a look at the doc for that: https://github.com/steemit/steem-js

const dsteem = require('dsteem')
const moment = require('moment')
const client = new dsteem.Client('https://api.steemit.com');

async function everything(name) {
	let account = await client.database.getAccounts([name]) // get account
	account = account[0]
	let dynamic = await global_properties() // these are global properties needed to calculate the steem price etc.
	let votingPower = await voting_power(account) // this is the calculation of the votingpower which is completely accurate
	let weight = 10000 // Calculate weight here - if your vote is worth 3$ and user wants 5$ then 100% (10000) - if the user wants 1$ then 1/3 => 0.33% (3333)
	return await vote_value(name, account, votingPower, weight, 'SBD', dynamic.reward_fund, dynamic.reward_fund_claims, dynamic.sbd_price, dynamic.total_vesting_fund_steem)
}

async function voting_power(account) {
	let base_voting_power = await account.voting_power // this is the votingpower, which is however not up-to-date because it only gets updated when you vote

	let last_time = moment.utc(account.last_vote_time).valueOf() // npm i moment
	let now = moment.utc().valueOf()
	let delta = (now - last_time) / 1000

	let updated_voting_power = base_voting_power + (10000 * delta / 432000)

	if (updated_voting_power > 10000) {
		updated_voting_power = 10000
	}

	return updated_voting_power
}

async function vote_value(name, account, vpower, vweight, asset, reward_fund, reward_fund_claims, sbd_price, total_vesting_fund_steem) {
	let effective_shares = await the_effective_shares_from_account(account, total_vesting_fund_steem)

	let used_power = (((vpower * vweight) / 10000) + 49) / 50
	let reward_shares = (effective_shares * used_power / 10000) * 1000000

	let value = reward_shares * reward_fund / reward_fund_claims
	if (asset == 'SBD') { value = value * sbd_price }
	return value
}


// The functions below are helper functions to calculate everything needed for the main calculations

async function the_effective_shares_from_account(account) {
	let vesting_shares = await convert_float(account.vesting_shares)
	let received_vesting_shares = await convert_float(account.received_vesting_shares)
	let delegated_vesting_shares = await convert_float(account.delegated_vesting_shares)
	return vesting_shares - delegated_vesting_shares + received_vesting_shares
}

function convert_float(text, asset) {
	let value = parseFloat(text.split(' ')[0])
	return value
}

function convert_number(text) {
	let value = parseFloat(text.split(' ')[0])
	return value
}

async function get_sbd_price() {
	let price = await client.database.getCurrentMedianHistoryPrice()
	return price.base.amount
}

async function global_properties() {
	let properties = await client.database.getDynamicGlobalProperties()
	let fund = await client.database.call('get_reward_fund', ['post'])
	let dynamic = {}
	dynamic.total_vesting_fund_steem = properties.total_vesting_fund_steem
	dynamic.total_vesting_fund = await convert_float(properties.total_vesting_fund_steem, 'STEEM')
	dynamic.total_vesting_shares = await convert_float(properties.total_vesting_shares, 'VESTS')
	dynamic.reward_fund = await convert_float(fund.reward_balance, 'STEEM')
	dynamic.reward_fund_claims = await fund.recent_claims
	dynamic.max_vote_denom = await properties.vote_power_reserve_rate * 432000 / (60 * 60 * 24)
	dynamic.sbd_price = await get_sbd_price()
	return dynamic
}
