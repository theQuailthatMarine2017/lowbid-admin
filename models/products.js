const { v4: uuidv4 } = require('uuid');

class product{
    constructor(photo,name,description,lowest_bid,cost,category,end_date) {
        this.id = uuidv4();
        this.PHOTO = photo;
        this.NAME = name;
        this.DESCRIPTION = description;
        this.LOWEST_BID = lowest_bid;
        this.COST = cost;
        this.AMOUNT_RAISED = 0;
        this.TOTAL_BIDS = 0;
        this.CATEGORY = category;
        this.DATE = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.END_DATE = new Date(end_date).toISOString().slice(0, 19).replace('T', ' ');
        this.COMPLETED = 0;
    }
}

//Functions For Access Accounts and Sys Logs
module.exports.products = function (photo,name,description,lowest_bid,cost,category,end_date) {

    const new_ = new product(photo,name,description,lowest_bid,cost,category,end_date);
    //Return Account To Route To Be Saved.
    return new_;
    
}