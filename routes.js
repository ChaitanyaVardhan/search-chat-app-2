var uu				= require('underscore');
var hash			= require('./pass').hash;

var users = {
	tj: { name: 'tj'}
}


var indexfn = function(req, res) {
	res.render("index");
}

var homefn = function(req, res) {
	res.render("home");
}

hash('foobar', function(err, salt, hash){
	if (err) throw err;
	users.tj.salt = salt;
	users.tj.hash = hash;
});

var authenticate = function(name, pass, fn) {
	var user = users[name];
	if(!user) return fn(new Error('cannot find user'));
	hash(pass, user.salt, function(err, hash) {
		if(err) return fn(err);
		if(hash == user.hash) return fn(null, user);
		fn(new Error('invalid password'))
	});
}

var loginfn = function(req, res) {
	authenticate(req.body.username, req.body.password, function(err, user){
		if(user) {
			req.session.regenerate(function() {
				req.session.user = user;
				req.session.success = 'Authenticated as ' + user.name
										+ ' click to <a href="/logout">Logout</a>. '
										+ ' You may now access <a href="/restricted">Restricted</a>. ';
				res.redirect('/home');
			});
		} else {
			req.session.error = 'Authentication failed, please check your '
				+ ' username and password.'
				+ ' (use "tj" and "foobar")';
			res.redirect('/');
		}
	})
}

var chatfn = function(req, res){
	res.sendFile(__dirname + '/views/index.html')
}

var logout = function(req, res) {
	req.session.destroy(function(){
		res.redirect('/');
	});
}

var restricted = function(req, res) {
	res.send('This is a restricted resource click to <a href="/logout">Logout</a>');
}

var restrict = function(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.error = 'Access denied! Please Login to access';
		res.redirect('/')
	}
}

var define_routes = function(dict) {
	var toroute = function(item) {
		return uu.object(uu.zip(['path', 'fn'], [item[0], item[1]]));
	};
	return uu.map(uu.pairs(dict), toroute);
}

var ROUTES = define_routes({
	'/': indexfn,
	'/logout': logout,
	'/home': [restrict, homefn],
	'/chat': [restrict, chatfn],
	'/restricted': [restrict, restricted]
})

var postROUTES = define_routes({
	'/login': loginfn,
})

module.exports = {
	'ROUTES': ROUTES,
	'postROUTES': postROUTES
};