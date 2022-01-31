class access{
    constructor(user,pass,code) {
        this.user = user;
        this.pass_code = pass;
        this.access_code = code;
        this.created = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
    }
}
//Functions For Access Accounts and Sys Logs
module.exports.account = function (user,pass,code) {

    const new_ = new access(user,pass,code);

    //Return Account To Route To Be Saved.
    return new_;
    
}