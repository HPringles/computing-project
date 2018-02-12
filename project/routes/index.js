var express         = require("express"),
    multer          = require("multer"),
    upload          = multer(),
    router          = express.Router(),
    cookieParser    = require("cookie-parser"),
    User            = require("../models/user.js"),
    crypto          = require("crypto");


// When the / route is requested - render the index page.
router.get("/", function(req, res){
    res.redirect("/chat");
    
});

router.get("/chat", function(req, res){
    res.render("index")
});

router.get("/login", function(req, res){
    User.find({}, function(err, users){
        if(err){return console.log(err)}
    
        
        res.render('login', {users: users});
    });
    

});

router.post("/login", upload.array() ,function(req, res, next){
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

router.post("/signup", upload.array() ,function(req, res, next){
    var newUser = new User({
        username: req.body.username,
        authenticationKey: crypto.randomBytes(12).toString("hex")
    });
    
    newUser.save(function(err, data){
        if(err) {return console.log(data)}
    });
    
    res.redirect("/login");
    // If userID supplied in req corresponds with an already create userID
    // Set the authentication cookie and redirect to the /chat route
    
    
});


router.get("/logout", function(req, res){
    //unset the cookies and redirect to the login page
    
    res.clearCookie("authKey");
    res.clearCookie("userName");
    res.clearCookie("userID");
    res.redirect("/login");
});


module.exports = router;