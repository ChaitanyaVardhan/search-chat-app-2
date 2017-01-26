var express 		= require('express')
  , http 			= require('http')
  , path			= require('path')
  , bodyParser		= require('body-parser')
  , session			= require('express-session')
  , chat 			= require('./chat').chat
  , ROUTES			= require('./routes');

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: 'secret'
}));
var server = http.createServer(app);
var socketio = require('socket.io');
var io = socketio(server);

io.on('connection', chat);

app.use(function(req,res,next) {
	var err = req.session.error;
	var msg = req.session.success;
	delete req.session.error;
	delete req.session.success;
	res.locals.message = '';
	if (err) res.locals.message = '<p class="msg error">' + err + '<p>';
	if (msg) res.locals.message = '<p class="msg success">' + msg + '<p>';
	next();
})

for(var ii in ROUTES.ROUTES) {
	app.get(ROUTES.ROUTES[ii].path, ROUTES.ROUTES[ii].fn)
}

for(var jj in ROUTES.postROUTES){
	app.post(ROUTES.postROUTES[jj].path, ROUTES.postROUTES[jj].fn)	
}

server.listen(app.get('port'), function() {
	console.log("Listening on " + app.get('port'));
})
