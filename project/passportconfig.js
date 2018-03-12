var localStrategy   = require("passport-local"),
    User            = require("./models/user.js"),
    crypto          = require("crypto")
    
module.exports = function(passport){
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });
    
    passport.use('local-signup', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, username ,password,done){
        process.nextTick(function(){
            User.findOne({'local.username': username}, function(err, user){
                if (err) return done(err);
                
                if (user) {
                    return done(null, false);
                } else {
                    
                    var newUser = new User();
                    
                    newUser.username = username;
                    newUser.password = newUser.generateHash(password);
                    newUser.authenticationKey = crypto.randomBytes(12).toString("hex");
                    
                    newUser.save(function(err){
                        if (err) throw err;
                        
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
    
    passport.use('local-login', new localStrategy({
        // Define the names of the form inputs
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
        
    },
    function(req, username, password, done){
        User.findOne({'local.username' : username}, function(err, user){
            if (err) return done(err);
            
            if (!user){
                return done(null, false)
            }
            
            if (!user.validPassword(password)){
                return done(null, false)
            }
            
            return done(null, user)
        })
    }))
    
};