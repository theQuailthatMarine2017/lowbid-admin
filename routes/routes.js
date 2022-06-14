var mysql = require('mysql2');
const bcrypt = require('bcrypt');
const saltRounds = 1;
var jwt = require('jsonwebtoken');

require('dotenv').config();

var connection = mysql.createConnection({
    user     : 'lowbid',
    password : 'Jesuspeace93!',
    database: 'lowbid'
});

const sys_actions = {
    login:'access_account_login',
    access_account:{
        create:'created_access_account',
        update:'updated_access_account',
        delete:'deleted_access_account',
        get:'get_access_accounts'

    },
    products:{
        create:'product created',
        updated:'product updated',
        deleted:'product deleted',
        get:'get products'
    },
    bids:{
        create:'bid created',
        updated:'bid updated',
        deleted:'bid deleted',
        get:'get bids'
    },
    logs:{
        create:'log created',
        updated:'log updated',
        deleted:'log deleted',
        get:'get logs'
    },
    mpesa:{
        success:'payment successful',
        failed:'payment failed'
    },
    winners:{
        created:'winner created',
        get:'get winners'
    },
    outcome:{
        success:'success',
        failed:'failed'
    }
}

// SYSTEM LOG
class log{
    constructor(action, outcome, result, ip, device) {
        this.OUTCOME = outcome
        this.ERROR = result
        this.SYS_ACTION = action;
        this.TIME = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.IP_SRC= ip;
        this.DEVICE = device
    }
}

var bidobject = {
    name:'',
    bid_placed:null,
    lowest_bid:null,
    mobile:'',
    mpesa:'',
}

module.exports = function(app){

    const access = require('../models/access');
    const product = require('../models/products');
    const winner = require('../models/winners');

    app.get('/hello',(req,res) => {


        res.send('Accessed');

    });

    app.get('/app/products', (req, res) => {

        res.header("Access-Control-Allow-Origin", "https://lowbids.co.ke");
        res.header("Access-Control-Allow-Methods", "GET");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Accept, x-client-key, x-client-token, x-client-secret, Authorization");

        connection.connect();
        //Express Validator
        console.log(process.env.AUTH_CODE);
        

            // Save Account To Database

            connection.query('SELECT * FROM PRODUCTS WHERE END_DATE > ? ORDER BY TOTAL_BIDS DESC',[new Date(Date.now())], function (error, products) {
                if(products === null){

                    res.json({message:"No Products Found"});

                }
                if (error){

                    //LOG ERROR 
                const log_ = new log(sys_actions.products.get,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:error});
                    }
                });

                }else{
                    // Neat!
                    // log action
                    const log_ = new log(sys_actions.products.get,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error, results) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            
                            res.json({products:products});
                        }
                      });
                }
              });
    
    });

    app.post('/access_accounts/create', (req, res) => {

        connection.connect();
        console.log(process.env.AUTH_CODE)
        if(req.body.auth === process.env.AUTH_CODE){

             //HASH PASSWORD
            console.log(req.body);
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(req.body.pass, salt);

            let account = access.account(req.body.user, hash,req.body.code);

            console.log(account);

            //Express Validator

            if(account != null){
                // Save Account To Database

                connection.query('INSERT INTO ACCESS_ACCOUNT SET ?', [account], function (error, results) {
                    if (error){
                        console.log(error)
                        //LOG ERROR 
                        const log_ = new log(sys_actions.access_account.create,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                        console.log(log_);
                        connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                            if (error){
                    
                                res.json({message:"Server Error"});
                            }
                        });


                    }else{
                        // SUCCESFUL! SUBMIT INFO
                        console.log(results);
                        // log action
                        const log_ = new log(sys_actions.access_account.create,sys_actions.outcome.success,null, req.headers["x-real-ip"],req.headers['user-agent']);

                        connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error, results) {
                            if (error){
                    
                                console.log(error);
                            }else{
                                // Neat!
                                console.log(results);
                                res.json({message:"Account Created"});
                            }
                        });
                    }
                });

                

            }else{
                res.json({message:"Server Error"});
            }

        }else{
            res.json({message:"Server Error"});
        }
       
    
    });

    app.get('/access-accounts', (req, res) => {

        connection.connect();
        //Express Validator

        if(req.headers['auth'] === process.env.AUTH_CODE){

            // Save Account To Database

            connection.query('SELECT * FROM  ACCESS_ACCOUNT', function (error, accounts) {
                if(accounts === null){

                    res.json({message:"No accounts Found"});

                }
                if (error){

                    //LOG ERROR 
                const log_ = new log(sys_actions.access_account.get,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    // Neat!
                    console.log(accounts);
                    // log action
                    const log_ = new log(sys_actions.access_account.get,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error, results) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            console.log(results);
                            res.json({accounts:accounts});
                        }
                      });
                }
              });
        }else{
            res.json({message:"Server Error"});
        }
    
    });

    app.post('/login', (req, res) => {

        if(req.headers['auth'] === process.env.AUTH_CODE){
            connection.connect();
            console.log(req.body.code)
            let login_user = {
                code:req.body.code,
                pass:req.body.pass
            }

            console.log(login_user);

            if(login_user.code != null){
                // Save Account To Database
                console.log("checking database....");
                connection.query('SELECT * FROM ACCESS_ACCOUNT WHERE access_code = ?', [req.body.code], function (error, results) {
                    
                    if (error != null){
                        console.log(error);
                        const log_ = new log(sys_actions.login,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                        connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                            if (error){
                                res.json({message:"Server Error"});
                            }
                        });
                    }else{
                        // Neat!
                        console.log(results);
                        if(results.length > 0){
                            results.forEach(account => {
                                console.log(account);
                                //BCRYPT COMPARE PASSWORD
                                const pass_ = bcrypt.compareSync(login_user.pass, account.pass_code);
                                console.log(pass_);
                                if (pass_) {

                                    var token = jwt.sign(account, 'lowidtoken');
                                    res.json({message:"Successful Login",token});
                                   
                                }else{
                                    res.status(403).json({message:"Login Failed. Incorrect code or pass."})
                                }
                            });
                        }else{
                            res.json({message:"Login Failed"})
                        }
                        
                        
                    }
                });
            }else{
                res.json({message:"Server Error"});
            }
        }else{
            res.json({message:"Unauthorized!"});
        }
    });
    
    app.post('/products/create', (req, res) => {

        if(req.headers['auth'] === process.env.AUTH_CODE){
            connection.connect();
            console.log(req.body.end_date);

            let product_ = product.products(req.body.photo,req.body.name, req.body.description,req.body.lowest_bid,req.body.cost,req.body.category,req.body.end_date);
            console.log(product_);

            //Express Validator

            if(product_ != null){
                // Save Account To Database
                connection.query('INSERT INTO PRODUCTS SET ?', [product_], function (error, results) {
                    if (error){
                        console.log(error.message)
                        //LOG ERROR 
                        const log_ = new log(sys_actions.products.create,sys_actions.outcome.failed, error.message, req.headers["x-real-ip"],req.headers['user-agent']);
                        console.log(log_);
                        connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                            console.log(error)
                            res.json({message:"Server Error"});
                        });

                    }else{
                        // SUCCESFUL! SUBMIT INFO
                        console.log(results);
                        // log action
                        const log_ = new log(sys_actions.products.create,sys_actions.outcome.success,null, req.headers["x-real-ip"],req.headers['user-agent']);
                        connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                            if (error){
                                console.log(error);
                            }else{
                                // Neat!
                                res.json({message:"Product Created"});
                            }
                        });
                    }
                });

                

            }else{
                res.json({message:"Server Error"});
            }
        }else{
            res.json({message:"Unauthorized!"});
        }

        
    
    });

    app.get('/products', (req, res) => {

        console.log(req.headers['auth'])
        connection.connect();
        //Express Validator
            // Save Account To Database

            connection.query('SELECT * FROM PRODUCTS WHERE END_DATE > ? ORDER BY TOTAL_BIDS DESC',[new Date(Date.now())], function (error, products) {
                if(products === null){
                    res.json({message:"No Products Found"});
                }
                if (error) {
                    res.json({message:error});
                } else {
                    console.log(products)
                    res.json({products:products});
                }
              });
    });

    app.post('/update/products', (req, res) => {

        if(req.headers['auth'] === process.env.AUTH_CODE){

            connection.connect();

            connection.query('UPDATE PRODUCTS SET PHOTO = ?, CATEGORY = ?, NAME = ?, DESCRIPTION = ?, LOWEST_BID = ?, COST = ?, END_DATE = ? WHERE id = ?',
            [req.body.PHOTO,req.body.CATEGORY, req.body.NAME,req.body.DESCRIPTION,req.body.LOWEST_BID,req.body.COST,req.body.END_DATE,req.body.id], function (error) {
                if (error){
                    //LOG ERROR 
                const log_ = new log(sys_actions.products.updated,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    console.log(req.body)
                    // Neat!
                    // log action
                    const log_ = new log(sys_actions.products.updated,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            res.json({message:"Product Updated"});
                        }
                      });
                }
              });

        }else{
            res.status(403).render();
        }
    
    });

    app.post('/delete/product', (req, res) => {

        if(req.headers['auth'] === process.env.AUTH_CODE){

            console.log(req.headers['auth'])
            connection.connect();
            //Express Validator

            if(req != null){

                // Save Account To Database
                connection.query('DELETE FROM PRODUCTS WHERE id = ?',[req.body.id], function (error) {
                    if (error){
                        //LOG ERROR 
                    const log_ = new log(sys_actions.products.deleted,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                        if (error){
                            res.json({message:"Server Error"});
                        }
                    });
    
                    }else{
                        // Neat!
                        // log action
                        const log_ = new log(sys_actions.products.deleted,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);
    
                        connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                            if (error){
                                console.log(error);
                            }else{
                                // Neat!
                                res.json({message:"Deleted Product"});
                            }
                          });
                    }
                  });
    
                
    
            }else{
                res.json({message:"Server Error"});
            }


        }else{
            res.json({message:"Server Error"});
        }
        

        
    
    });

    app.get('/bids', (req, res) => {

        connection.connect();
        //Express Validator

        if(req != null){
            // Save Account To Database

            connection.query('SELECT * FROM BIDS', function (error, bids) {
                if(bids === null){

                    res.json({message:"No bids Found"});

                }
                if (error){

                    //LOG ERROR 
                const log_ = new log(sys_actions.bids.get,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    // Neat!
                    console.log(bids);
                    // log action
                    const log_ = new log(sys_actions.bids.get,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error, results) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            console.log(results);
                            res.json({bids:bids});
                        }
                      });
                }
              });

            

        }else{
            res.json({message:"Server Error"});
        }
    
    });

    app.get('/getbid', (req, res) => {

        connection.connect();
        //Express Validator
        console.log(req.headers)

        if(req != null){
            // Save Account To Database

            connection.query('SELECT * FROM BIDS WHERE PRODUCT = ? ORDER BY BID_DIF ASC LIMIT 1',[req.headers['bid']], function (error, bids) {
                if(bids === null){

                    res.json({message:"No bids Found"});

                }
                if (error){

                    //LOG ERROR 
                const log_ = new log(sys_actions.bids.get,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    // Neat!
                    console.log(bids);
                    // log action
                    const log_ = new log(sys_actions.bids.get,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error, results) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            console.log(results);
                            res.json({bids:bids});
                        }
                      });
                }
              });

            

        }else{
            res.json({message:"Server Error"});
        }
    
    });

    //Log Routes
    app.get('/logs', (req, res) => {

        connection.connect();
        //Express Validator

        if(req != null){
            // Save Account To Database

            connection.query('SELECT * FROM SYS_LOGS ORDER BY TIME DESC', function (error, logs) {
                if(logs === null){

                    res.json({message:"No logs Found"});

                }
                if (error){

                    //LOG ERROR 
                const log_ = new log(sys_actions.logs.get,sys_actions.outcome.failed, error, req.headers.req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    // Neat!
                    console.log(logs);
                    // log action
                    const log_ = new log(sys_actions.logs.get,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error, results) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            console.log(results);
                            res.json({logs:logs});
                        }
                      });
                }
              });

            

        }else{
            res.json({message:"Server Error"});
        }
    
    });

    //Winners Routes
    app.post('/submit/winner', (req,res) => {

        if(req.headers['auth'] === process.env.AUTH_CODE){
            let winner_ = winner.winners(req.body.MOBILE_NO,req.body.idBIDS,req.body.PRODUCT);
            console.log(winner_);

            connection.query('INSERT INTO WINNERS SET ?', [winner_], function (error) {
                if (error){
                    console.log(error)
                    res.json({message:"Server Error"});
                    //LOG ERROR 
                const log_ = new log(sys_actions.winners.created,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    // log action
                    const log_ = new log(sys_actions.winners.created,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);
                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            //Africa Talking SMS to Winning Mobile
                            const options = {
                                to: [winner_.MOBILE],
                                message: `You Are The Lucky Winner With The Lowest Unique Bid! You Have Won ${winner_.PRODUCT_WON}! Please Contact Us Through 0705009784 For Your Prize Collection! Thank You For Choosing Lowbids!`
                            }

                            console.log(sms)

                            sms.send(options)
                                .then( response => {

                                    console.log(response.SMSMessageData["Recipients"])
                                    if(response["Recipients"] != []){
                                        //Update product Complete to 1 TRUE
                                        connection.query('UPDATE PRODUCTS SET COMPLETED = 1 WHERE NAME = ?' , [winner_.PRODUCT_WON], function (error) {
                                            if (error){
                                                console.log(error);
                                            }else{
                                                // log action
                                                const log_ = new log(sys_actions.products.updated,sys_actions.outcome.success,null, req.headers["x-real-ip"],req.headers['user-agent']);
                                                // Neat!
                                                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                                                    if (error){
                                                        console.log(error);
                                                    }else{
                                                        // Neat!
                                                        res.json({message:'Winner Submitted!'});
                                                    }
                                                  });
                                            }
                                          });

                                    }else{
                                        res.json({message:response.Message});
                                    }
                                })
                                .catch( error => {

                                    console.log(error)
                                    res.json({message:error});
                                });
                        }
                      });
                }
            });
        }
    });

    app.get('/winners', (req, res) => {

        connection.connect();
        //Express Validator

        if(req.headers['auth'] === process.env.AUTH_CODE){
            // Save Account To Database

            connection.query('SELECT * FROM WINNERS ORDER BY DATE ASC', function (error, winners) {
                if(winners === null){

                    res.json({message:"No winners Found"});

                }
                if (error){

                    //LOG ERROR 
                const log_ = new log(sys_actions.winners.get,sys_actions.outcome.failed, error, req.headers["x-real-ip"],req.headers['user-agent']);
                connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                    if (error){
                        res.json({message:"Server Error"});
                    }
                });

                }else{
                    // Neat!
                    console.log(winners);
                    // log action
                    const log_ = new log(sys_actions.winners.get,sys_actions.outcome.success,null,req.headers["x-real-ip"],req.headers['user-agent']);

                    connection.query('INSERT INTO SYS_LOGS SET ?', [log_], function (error) {
                        if (error){
                            console.log(error);
                        }else{
                            // Neat!
                            res.json({winners:winners});
                        }
                      });
                }
              });

            

        }else{
            res.json({message:"Server Error"});
        }
    
    });
}