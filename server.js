var express = require("express"); 
var session = require('express-session');
var path = require("path"); 
var app = express(); 
var bodyParser = require('body-parser'); 
let currentUsers = [];
let messages = [];
let index = 0;
function generateWord(index) {
    let words = ['sockets', 'functions', 'javascript'];
    return words[index];
}
let currentWord = generateWord(index);
const http = require('http').Server(app);
//attach http server to socket.io
const io = require('socket.io')(http);

app.use(session({
    secret: 'keyboardkitteh',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))

app.use(bodyParser.urlencoded({ extended: true })); // use it!
app.use(express.static(path.join(__dirname, "./static"))); // static content
app.set('views', path.join(__dirname, './views')); // setting up ejs and our views folder
app.set('view engine', 'ejs'); // root route to render the index.ejs view
app.get('/', function(req, res) { // post route for adding a user
    res.render("index");
})

class Users {
    constructor() {
        this.users = []; 
    }

    addUser(name, id) {
        let user = {name, id};
        this.users.push(user);
    }
}

let user = new Users;
//create a new connection
io.on('connection', function (socket) {
    console.log('a user connected:' + socket.id);
    socket.on('new_user', function(name) {
        
        socket.username = name;
        currentUsers.push( {name: name, socket_id: socket.id} );
        io.emit('update_users', currentUsers);
        io.emit('update_messages', messages);
        io.emit('update_word', currentWord);
    });
    
    socket.on('disconnect', function() {
        console.log('a user disconnected:', socket.id);
        for (let i = 0; i < currentUsers.length; i++) {
            let user = currentUsers[i];
            if (user.socket_id === socket.id) {
                currentUsers.splice(i, 1);
                break;
            }
        }
        io.emit('update_users', currentUsers);
    });

    
    socket.on('new_message', function (message) {
        let newMessage = {
            name: socket.username,
            message: message
        }

        if (message === currentWord) {
            index++;
            newMessage = {
                name: 'System',
                message: `${newMessage.name} got the correct answer`
            }
            currentWord = generateWord(index);
            io.emit('update_word', currentWord);
        }
        messages.push(newMessage);
        io.emit('update_messages', messages);
    });
});

// tell the express app to listen on port 8000
http.listen(8000, function() {
    console.log("listening on port 8000");
});
