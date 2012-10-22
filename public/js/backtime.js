$(document).ready(function() {
	var Debug = {

		log: function (msg) {
			console.log(new Date().toJSON() +": "+ msg);
		},

		toggle: function(speed) {
			speed = speed || 'fast';
			defaultDebug.slideToggle(speed);
		}
	};

	function init() {
		Debug.log("Connecting...");

		$('input').focus(function() {
			isTyping = true;
		});

		$('input').blur(function() {
			isTyping = false;
		});

		limit.on('change', function() {
			tweets.html('');
			showMaxTweets = limit.val();
		});

		$(document).keyup(function(e) {

			if (!isTyping) {
				switch (e.keyCode) {
					case 32: // space
							tweets.html('');
						break;
					case 220: // backslash
							Debug.toggle();
						break;
				}
			} else { // input field has the focus
				switch (e.keyCode) {
					case 13: // enter
							socket.emit('search', { search: search.val() });
							search.val('');
							tweets.html('');
							maxSpeed.html(0);
						break;
				}
			}

		});

		calcMaxPerSecond();
		showMaxTweets = limit.val();
	}

	function calcMaxPerSecond() {
		maxPerSecondInterval = setInterval(function() {
			speed.html(tweetsAmount);

			if (maxTweetsAmount < tweetsAmount) {
				maxTweetsAmount = tweetsAmount;
			}

			maxSpeed.html(maxTweetsAmount);

			tweetsAmount = 0;
		}, 1000);
	}

	/*
	* Main
	*/

	var socket = new io.connect(window.location.href);
	
	var tweets = $("#tweets ul"),
		defaultDebug = $("#stats"),
		search = $("input#search"),
		speed = $("#speed"),
		maxSpeed = $("#maxSpeed"),
		query = $('span#query'),
		limit = $('select#limit'),
		maxPerSecondInterval = null,
		tweetsAmount = 0,
		maxTweetsAmount = 0,
		isTyping = false,
		showMaxTweets = 0;

	init();

	/*
	* Socket stuff
	*/

	function convertURLs(str){
		var regex = /(https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w\/_\.]*(\?\S+)?)?)?)/g;
		return str.replace(regex, "<a href='$1' title='Open this link in a new tab' target='_blank'>$1</a>");
	}

	function strdecode(data) {
		return JSON.parse(decodeURIComponent(escape(data)));
	}

	socket.on('connect', function() {
		Debug.log("Connected.");
	});
			
	socket.on('disconnect', function() {
		Debug.log("Disconnected.");
		clearInterval(maxPerSecondInterval);
	});
		
	socket.on('tot', function(data) {
		Debug.log("Current viewers: "+ data.tot);
	});

	socket.on('filters', function(data) {
		query.html(data.value);
		Debug.log("Param: "+ data.param +", value: "+ data.value);
	});

	socket.on('tweet', function(tweet) {
		tweet = strdecode(tweet);

		if (showMaxTweets != 0) { // != infinite list
			if (tweets.find("li").length + 1 > showMaxTweets ) {
				tweets.find("li:last").remove();
			}
		}
		// <img id="avatar" src="'+ tweet.user.profile_image_url +'" alt="" width="48" height="48" /> 
        tweets.prepend('<li>'+ tweet.created_at +' <strong><a href="http://www.twitter.com/'+ tweet.user.screen_name +'" title="Open profile" target="_blank">'+ tweet.user.screen_name +'</a></strong>: '+ convertURLs(tweet.text) +' (Retweets: '+ tweet.retweet_count +')</li>');

		tweetsAmount++;
	});

	// socket.on('oldtweets', function(feed) {
	// 	feed = strdecode(feed);

	// 	tweets.append("<li> * old tweets *</li>");
	// 	feed.results.forEach(function(tweet, index) {
	// 		// console.log(index, tweet.created_at, tweet.text);
	// 		tweets.append("<li>"+ tweet.created_at +" "+ tweet.from_user +": "+ convertURLs(tweet.text) +" (Retweets: "+ (typeof tweet.metadata.recent_retweets == "undefined" ? "0" : tweet.metadata.recent_retweets) +")</li>");
	// 	});
	// });
});