var uu				= require('underscore');
var hash			= require('./pass').hash;
var request			= require('request');

var users = {
	user2: { name: 'user2'},
	chaitanya: {name: 'chaitanya'}
}


hash('foobar', function(err, salt, hash){
	if (err) throw err;
	users.user2.salt = salt;
	users.user2.hash = hash;
});

hash('develop', function(err, salt, hash){
	if (err) throw err;
	users.chaitanya.salt = salt;
	users.chaitanya.hash = hash;
});

var indexfn = function(req, res) {
	res.render("index");
}

var homefn = function(req, res) {
	res.render("home");
}

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
			req.session.error = err 
				+ ' Authentication failed, please check your '
				+ ' username and password.'
				+ ' (use "tj" and "foobar")'
				+ ' or (use "chaitanya" and "develop")';
			res.redirect('/');
		}
	})
}

var chatfn = function(req, res){
	res.sendFile(__dirname + '/views/index.html')
}

var searchfn = function(req, res){
	res.render("search",{data: ''});
}

var mongolab_api_url = function(query){
	var obj = {"company": query};
	var url = 'https://api.mlab.com/api/1/databases/search-chat-db/collections/prod?q=' 
				+ JSON.stringify(obj) 
				+ '&apiKey=' + process.env.MONGO_API_KEY;
	return url;
}

var search_result = function(req, res){
	var query = req.body.query;
	request.get(mongolab_api_url(query), function(err, resp, body){
		if(err){
			req.session.error = err;
			res.render("search");
			return;
		}
		search_results = JSON.parse(body);
		res.render("search", {data: search_results}); 
	})

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
	'/search': [restrict, searchfn],
	'/restricted': [restrict, restricted]
})

var postROUTES = define_routes({
	'/login': loginfn,
	'/searchresult': [restrict, search_result],
})

module.exports = {
	'ROUTES': ROUTES,
	'postROUTES': postROUTES
};
