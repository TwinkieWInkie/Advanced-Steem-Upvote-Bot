module.exports = class {
    constructor (deposit) {
        this.deposit = deposit
    }

    doRefund () {
        if (this.deposit.data.amount.indexOf('STEEM') > -1) {
            this.deposit.res.sendSteem(
                this.deposit.data.amount,
                'Refunding'
            );
        } else {
            this.deposit.res.sendSbd(
                this.deposit.data.amount,
                'Refunding'
            );
        }
    }
}