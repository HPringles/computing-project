var socket = io();


function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


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
        whatsUpController.chats = [];
        whatsUpController.contacts = [];
        whatsUpController.currentChatID = undefined;
        whatsUpController.currentChatIndex = undefined
        
        // SEND message to server with authentication key, if it is saved as a cookie - if not redirect to the login page
        if(!getCookie('authKey') && !getCookie('userName') && !getCookie('userID')){
            window.location = "/login"
        } else {
            socket.emit('authentication message', {authKey: getCookie('authKey'), userID: getCookie('userID')})
        }
        
        // If authentication fails, force the user to login again
        socket.on("auth failed", function(){
            window.location = "/logout"
        })
        
        // When message of type "roster update" is recieved, update the value of whatsUpController.roster
        socket.on("roster update", function(data){
            // $timeout allows the data to update instantly, instead of when page focus is triggered(button press or text input)
            $timeout(function(){
                console.log(data)
                whatsUpController.roster = data;
                whatsUpController.roster.forEach(function(user){
                    var foundInContacts = false
                    whatsUpController.contacts.forEach(function(contact){
                        if (user === null){
                            return
                        }
                        if (user._id == contact._id || user._id == getCookie('userID')){
                            foundInContacts = true
                        }
                    })
                    
                    if (!foundInContacts){
                        // console.log(data[0])
                        // console.log(whatsUpController.contacts[1])
                        // whatsUpController.contacts.push(user)
                    }
                    console.log(whatsUpController.contacts)
                })
                
            });
            
            
        });
        
        // Get a message that was sent as part of the initialisation process
        socket.on("initialisation data", function(data){
            console.log(data)
            data.chats.forEach(function(chat){
                console.log(chat)
                chat.chatMessages.forEach(function(message){
                    message.messageText = whatsUpController.decryptMessage(message.messageText)
                })
            })
            $timeout(function(){
                whatsUpController.chats = data.chats;
                whatsUpController.contacts = data.users;
                whatsUpController.encryptionKey = data.password
                whatsUpController.initComplete = true;
            });
            
        });
        
        // When the initialisation is complete
        socket.on("initialisation complete", function(){
            // For each message in the waiting list
            whatsUpController.waitingMessages.forEach(function(message){
                // Add the message to the messages array so that it can be displayed
                whatsUpController.messages.push(message);
                
            });
            // set the initComplete value to true to allow the rest of the script to run
            whatsUpController.initComplete = true;

        });
        
        socket.on("chat message", function(data){
            
            console.log("msg recieved");
            // If initialisation is complete, add the message to the messages array
            if(whatsUpController.initComplete){
                $timeout(function(){
                    // appends the message data to the whatsAppController.messages array
                    console.log(data.message)
                    data.message.messageText = whatsUpController.decryptMessage(data.message.messageText)
                    
                    whatsUpController.chats.forEach(function(chat){
                        if (chat._id == data.chat){
                            whatsUpController.chats[whatsUpController.chats.indexOf(chat)].chatMessages.push(data.message);
                            
                        }
                    });
                });
            //Otherwise add it to the waiting array
            } else {
                whatsUpController.waitingMessages.push(data);
            }
            
        });
        // When a database message is recieved - determine what type of database update it is (only one option for now)
        socket.on("database update", function(data){
            switch(data.type){
                case "new chat":
                    newChatFromDatabase(data.data)
            }
        })
        
        
        whatsUpController.switchChat = function(userID){
            var found;
            console.log(whatsUpController.chats)
            
            whatsUpController.chats.forEach(function(chat){
                var foundUser = false
                chat.chatParticipants.forEach(function(part){
                    if (part == userID) {
                        foundUser = true
                    }
                })
                if (foundUser){found = whatsUpController.chats.indexOf(chat)}
            })
            console.log("Switching Chat...")
            console.log(found)
            if (found == undefined) {
                var loggedInUserID = getCookie("userID")
                console.debug("No Chat found, creating new chat")
                socket.emit('create chat', [userID, loggedInUserID], function(chat){
                    console.debug("New chat created with user: " + userID)
                    whatsUpController.chats.push(chat)
                    whatsUpController.currentChatIndex = whatsUpController.chats.indexOf(chat)
                    whatsUpController.currentChatID = chat._id
                    whatsUpController.messages = chat.chatMessages
                })
                
            } else {
                whatsUpController.currentChatID = whatsUpController.chats[found]._id
                whatsUpController.currentChatIndex = found
                whatsUpController.messages = whatsUpController.chats[found].chatMessages
            }
            
            
            
            
        }
        
        // When the form is submitted, send the message to the server
        whatsUpController.sendMessage = function(){
            
            // checks there is a message in the box, then sends it
            if (whatsUpController.messageText && whatsUpController.currentChatID){
                socket.emit("chat message", {chatID: whatsUpController.currentChatID, messageText: whatsUpController.encryptMessage(whatsUpController.messageText), userID: getCookie('userID')});
            } else {
                alert("Error, enter a message and/or open a chat in order to correctly send a message")
            }
        };
        
        // When the update username button is clicked, create a prompt and ask for a new username to be entered
        whatsUpController.updateUsername = function(){
            
            whatsUpController.username = null;
            
            while(!whatsUpController.username){
                whatsUpController.username = prompt("Enter a new username \n (If the username is incorrect this window will reopen.)");
            }
            
            // send the new username
            socket.emit("update user", whatsUpController.username, function(success){
                if (success === true){
                    // SET COOKIE TO NEW USERNAME
                }
            });
        };
        
        whatsUpController.decryptMessage = function(messageText){
            // Convert the encrypted hex to bytes
            var encryptedBytes = aesjs.utils.hex.toBytes(messageText);
            // Set up the encryption mode
            var aesCtr = new aesjs.ModeOfOperation.ctr(new Uint8Array(whatsUpController.encryptionKey), new aesjs.Counter(5));
            // Decrypt the message
            var decryptedBytes = aesCtr.decrypt(encryptedBytes);
            // convert the message back to text
            return aesjs.utils.utf8.fromBytes(decryptedBytes);
        }
        
        whatsUpController.encryptMessage = function(messageText){
            // Convert the text to bytes
            var textBytes = aesjs.utils.utf8.toBytes(whatsUpController.messageText);
            // Set up the encryption mode.
            var aesCtr = new aesjs.ModeOfOperation.ctr(new Uint8Array(whatsUpController.encryptionKey), new aesjs.Counter(5));
            // Encrypt the message
            var encryptedBytes = aesCtr.encrypt(textBytes);
            // Convert the message to hex for easy transfer
            var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        }
        
        /*  If a new chat is recieved from the database 
            Add it to the list of chats if it is not already there.
        */
        function newChatFromDatabase(recvChat){
            console.debug("New Chat Recieved from database")
            var found = false
            whatsUpController.chats.forEach(function(chat){
                if(chat._id == recvChat._id){
                    found = true
                }
            })
            
            if (found) {
                return false;
            } else{
                whatsUpController.chats.push(recvChat)
            }
        }
});
    

