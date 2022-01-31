const { v4: uuidv4 } = require('uuid');

class winner{
    constructor(mobile,bid_id,product) {
        this.idWINNERS = uuidv4();
        this.MOBILE = mobile;
        this.BID_ID = bid_id;
        this.PRODUCT_WON = product;
        this.DATE = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
}

//Functions For Access Accounts and Sys Logs
module.exports.winners = function (mobile,bid_id,product) {

    const new_ = new winner(mobile,bid_id,product);

    //Return Account To Route To Be Saved.
    return new_;
    
}