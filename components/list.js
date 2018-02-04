module.exports = class {
	constructor (keystone) {
		this.keystone = keystone
	}
	
	checkUsername (username, resolve, reject) {
		this.keystone.list('BotLists').model.find().exec( (err, lists) => {
			console.log(username)
			console.log(lists)
			let inList = lists.filter(i => i.members.includes(username))
			console.log(inList)
			if (inList.length > 0)
				resolve({
					voteValue: inList[0].voteValue,
					bidAmount: inList[0].bidAmount
				})
			else
				reject()		
		})

	}
}
