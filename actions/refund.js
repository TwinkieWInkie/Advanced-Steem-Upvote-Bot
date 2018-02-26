module.exports = class {
    constructor (deposit) {
        this.deposit = deposit
    }

    doRefund (err = 'Unexpected error') {
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
        
		this.deposit.data.receivedRefund = true
		this.deposit.data.done = true
		this.deposit.data.save((err) => console.log(err))
    }
}
