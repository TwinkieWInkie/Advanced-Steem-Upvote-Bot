require('dotenv').config()

const keystone = require('keystone')

keystone.init({
    'port': 3001,
    'name': 'SteemPonzi',
    'brand': 'SteemPonzi',
    'headless': true
})

keystone.set('locals', {
    _: require('lodash'),
    env: keystone.get('env'),
    utils: keystone.utils,
    editable: keystone.content.editable,
});

keystone.import('../../models');

keystone.start();

module.exports = keystone
