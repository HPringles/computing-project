var socket = io();

// CREATE A MODULE TO RUN THE ANGULARJS CODE INSIDE OF
angular.module('whatsUp', [])
    //CREATE A CONTROLLER FOR THE VIEW - $timeout is injected to allow me to use it later.
    .controller('whatsUpController', function($timeout){
        // Make the controller accessible from the whatsUpController object
        var whatsUpController = this;
        
        // SET UP STARTING VARIABLES
        whatsUpController.messages = [];
        whatsUpController.roster = [];
        whatsUpController.username = null;
        whatsUpController.initComplete = false;
        whatsUpController.waitingMessages = [];
        
        // SEND message to server with authentication key, if it is saved as a cookie - if not redirect to the login page
        if(!document.cookie['authKey'] && !document.cookie['userName'] && !document.cookie['userID']){
            window.location = "/login"
        } else {
            socket.emit('initialisation message', {authKey: document.cookie['authKey'], userID: document.cookie['userID']})
        }
        

        // When message of type "roster update" is recieved, update the value of whatsUpController.roster
        socket.on("roster update", function(data){
            // $timeout allows the data to update instantly, instead of when page focus is triggered(button press or text input)
            $timeout(function(){
                whatsUpController.roster = data;
            });
            
            
        });
        
        // Get a message that was sent as part of the initialisation process
        socket.on("database message", function(data){
            whatsUpController.messages.push(data);
        });
        
        // When the initialisation is complete
        socket.on("initialisation complete", function(){
            // For each message in the waiting list
            whatsUpController.waitingMessages.forEach(function(message){
                // Add the message to the messages array so that it can be displayed
                whatsUpController.messages.push(message);
            })
            // set the initComplete value to true to allow the rest of the script to run
            whatsUpController.initComplete = true;

        });
        
        socket.on("chat message", function(data){
            // If initialisation is complete, add the message to the messages array
            if(whatsUpController.initComplete){
                $timeout(function(){
                    // appends the message data to the whatsAppController.messages array
                    whatsUpController.messages.push(data); 
                });
            //Otherwise add it to the waiting array
            } else {
                whatsUpController.waitingMessages.push(data);
            }
            
        });
        
        // When the form is submitted, send the message to the server
        whatsUpController.sendMessage = function(){
            // checks there is a message in the box, then sends it
            if (whatsUpController.messageText){
                socket.emit("chat message", whatsUpController.messageText);
            }
        };
        
        // When the update username button is clicked, create a prompt and ask for a new username to be entered
        whatsUpController.updateUsername = function(){
            
            whatsUpController.username = null;
            
            while(!whatsUpController.username){
                whatsUpController.username = prompt("Enter a new username \n (If the username is incorrect this window will reopen.)");
            }
            
            // send the new username
            socket.emit("update user", whatsUpController.username);
        };
});
    

