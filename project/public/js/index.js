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
        
        // SET USERNAME ON WINDOW OPEN
        // if the user doesnt type anything into the prompt, reopen the prompt and try again.
        while(!whatsUpController.username){
            whatsUpController.username = prompt("Enter a username");
        }
        socket.emit("new user", whatsUpController.username);

        // When message of type "roster update" is recieved, update the value of whatsUpController.roster
        socket.on("roster update", function(data){
            // $timeout allows the data to update instantly, instead of when page focus is triggered(button press or text input)
            $timeout(function(){
                whatsUpController.roster = data;
            });
            
            
        });
        
        socket.on("chat message", function(data){
            $timeout(function(){
                // appends the message data to the whatsAppController.messages array
                whatsUpController.messages.push(data); 
            });
            
        });
        
        // When the form is submitted, send the message to the server
        whatsUpController.sendMessage = function(){
            socket.emit("chat message", whatsUpController.messageText);
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
    

