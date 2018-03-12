var express         = require("express"),
    multer          = require("multer"),
    upload          = multer(), 
    cookieParser    = require("cookie-parser"),
    User            = require("../models/user.js"),
    crypto          = require("crypto");

module.exports = function(app, passport){
    

// When the / route is requested - render the index page.
app.get("/", function(req, res){
    res.redirect("/chat");
    
});
/*  When the chat route is requested - render the chat page.
    The authentication is handled in the view's logic */
app.get("/chat", function(req, res){
    res.render("index")
});

/*  When the /login route is requested, 
    send all users to the login page
*/
app.get("/login", function(req, res){
    User.find({}, function(err, users){
        if(err){return console.log(err)}
    
        
        res.render('login', {users: users});
    });
    

});
/*
    When the /login route is POST requested
    login the user
*/
app.post("/login", upload.array() ,function(req, res, next){

    User.findById(req.body.id, function(err, data){
        if(err){ return console.log(err) }
        res.cookie('userName', data.username);
        res.cookie('authKey', data.authenticationKey);
        res.cookie('userID', data.id);
        res.redirect("/chat");
    });
    // If userID supplied in req corresponds with an already create userID
    // Set the authentication cookie and redirect to the /chat route
    
    
});

/* 
    When the /signup route is POST requested
    create a new user with the data passed to the request
*/
app.post("/signup", upload.array() , passport.authenticate('local-signup', {
    successRedirect: "/authorise",
    failureRedirect: "/login"
}))

app.get("/authorise", function(req, res, next){
    res.cookie('userName', req.user.username);
    res.cookie('authKey', req.user.authenticationKey);
    res.cookie('userID', req.user.id);
    res.redirect("/chat")
})

//function(req, res, next){
    // var newUser = new User({
    //     username: req.body.username,
    //     authenticationKey: crypto.randomBytes(12).toString("hex")
    // });
    
    // newUser.save(function(err, data){
    //     if(err) {return console.log(data)}
    // });
    
    // res.redirect("/login");
    // // If userID supplied in req corresponds with an already create userID
    // // Set the authentication cookie and redirect to the /chat route
    
    
    
    
// });

/* 
    When the logout route is requested, 
    remove all cookies from the user and redirect to the login route
*/
app.get("/logout", function(req, res){
    //unset the cookies and redirect to the login page
    
    res.clearCookie("authKey");
    res.clearCookie("userName");
    res.clearCookie("userID");
    res.redirect("/login");
});


};