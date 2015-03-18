var express = require('express'), app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var fs = require('fs');

// Aca incluimos todo lo del IRC
eval(fs.readFileSync('cp.js')+'');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('config',function(c){
    console.log('**CONFIG**',c);
    configurar(c);
    var client = conectar();
  });

  socket.on('chat message', function(p){
    decir(p.to,p.msg);
  });
});

http.listen(1337, function(){
  console.log('listening on *:1337');
});
