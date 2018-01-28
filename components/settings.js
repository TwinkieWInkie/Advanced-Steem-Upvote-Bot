
 module.exports = class {
    constructor (keystone) {
		this.keystone = keystone
    }
    
    getConfigs (callback) {
		this.keystone.list('BotSettings').model.find().lean().exec( (err, settings) => {
			settings.forEach((config) => callback(config))
		})
	}
}
