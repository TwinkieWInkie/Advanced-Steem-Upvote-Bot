module.exports = class {
    constructor (deposit, settings) {
        this.deposit = deposit
        this.settings = settings

        this.post = {
            author: extractUsernameFromLink(this.deposit.data.memo),
            permlink: extractPermlinkFromLink(this.deposit.data.memo)
        }
    }

    check () {
        return this.checks.every( (i) => i === true )
    }
}

function extractUsernameFromLink(steemitLink) {
    if (isValidSteemitLink(steemitLink)) {
        const usernamePos = steemitLink.search(/\/@.+\//);
        if (usernamePos === -1) return;

        const firstPart = steemitLink.slice(usernamePos + 2); // adding 2 to remove "/@"
        return firstPart.slice(0, firstPart.search('/'));
    }
}

function extractPermlinkFromLink(steemitLink) {
    if (isValidSteemitLink(steemitLink)) {
        const usernamePos = steemitLink.search(/\/@.+\//);
        if (usernamePos === -1) return;

        const firstPart = steemitLink.slice(usernamePos + 1); // adding 1 to remove the first "/"
        return firstPart.slice(firstPart.search('/') + 1).replace('/', '').replace('#', '');
    }
}