module.exports = class {
    constructor (deposit) {
        this.deposit = deposit
    }

    doRefund (err) {
    	console.log('doingRefund')
        if (this.deposit.data.amount.indexOf('STEEM') > -1) {
            this.deposit.res.sendSteem(
                this.deposit.data.amount,
                err
            );
        } else {
            this.deposit.res.sendSbd(
                this.deposit.data.amount,
                err
            );
        }
    }
}
