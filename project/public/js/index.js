$(function () {
        
                var socket = io();
                username = "";
                while (username == ""){
                var username = prompt("Enter username") // prompt the user to enter a username
                }
                // run the set username function to send the entered username to the server.
                setUsername(username);
                
                // send the username to the server
                function setUsername(username){
                  console.log("username set")
                  socket.emit("new user", username)
                }
                
                function sendMessage(messageLocation){
                    // Send the message located in the supplied messageLocation
                    if ($(messageLocation).val() == ""){
                      alert("error sending message");
                      return false;
                    }
                    socket.emit('chat message', $(messageLocation).val());
                    // Reset the Message box to have no value.
                    $(messageLocation).val('');
                }
                
                // When a message is entered and the button is pressed, run the send message function
                $('#btn').click(function(){
                  sendMessage('#m');
                });
                
                // When the enter key is pressed, run the send message function
                $('form').keypress(function(e){
                  if (e.which == 13) {
                      e.preventDefault();
                      sendMessage('#m');
                  }
                  
                });
                
                $('#user').click(function(){
                  var newName = ""
                  while (newName == ""){
                    newName = prompt("Enter new username");
                  }
                    socket.emit("update user", newName)
                })
                
                socket.on('chat message', function(msg){
                  $('#messages').append($('<li>').text(msg));
                });
                
                socket.on('roster update', function(roster){
                  console.log(roster)
                  rosterString = ""
                  roster.forEach(function(user){
                    rosterString += user + ", ";
                  })
                  console.log(rosterString)
                  $('#roster').text("Users online: "  + rosterString)
                })
                
              });