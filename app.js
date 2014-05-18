
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var mongoose = require('mongoose');
var passport = require('passport');

var mongoConfig = require('./config/db'); // TODO [DB] : Connect to database
var passportConfig = require('./config/passport'); // TODO [FB] : Passport configuration

var app = express();

var Vote = mongoose.model('Vote'); // TODO [DB] : Get Vote model

var numOfLevels = 7;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser(process.env.COOKIE_SECRET));
//app.use(express.cookieParser("ajkldsasdfjaksfjhakwejwaegfkjfaaskllzkjx"));
app.use(express.session());

// https://github.com/jaredhanson/passport#middleware
app.use(passport.initialize());
app.use(passport.session());
// Session based flash messages
app.use(flash());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
  var messages = req.flash('info');
  res.render('index', {messages: messages});
});

/* Stores vote option in session and invokes facebook authentication */
app.post('/vote', function(req, res, next){
  // Stores the voted option (conveted to number) into session
  req.session.vote = +req.body.vote;

  //test code
  //res.redirect('/result');

  /* TODO [FB] : Redirect to passport auth url! */
  // Directly invoke the passport authenticate middleware.
  // Ref: http://passportjs.org/guide/authenticate/
  //

  passport.authenticate('facebook')(req, res, next); //authenticate in facebook.com
});

// TODO [FB]: Facebook callback handler
// Ref: https://github.com/jaredhanson/passport-facebook/blob/master/examples/login/app.js#L100
//
app.get('/fbcb', passport.authenticate('facebook', {
   successRedirect:'/result', //successfully get access token
   failureRedirect: '/' //failed to get access token from user
}));

var statisticalResult = [];
var totalVotes = 0;

app.get('/result', function(req, res){

  var vote = req.session.vote, // The voted item (0~6)
      //fbid = "" + Math.random();    // Facebook ID. (Fake)
      fbid = req.user && req.user.id; // TODO [FB]: Get user from req.user

  // Delete the stored session.
  //
  delete req.session.vote;
  req.logout(); // Delete req.user

  // Redirect the malicious (not voted or not logged in) requests.
  //
  if( vote === undefined || fbid === undefined ){
    req.flash('info', "請先在此處投票。");
    return res.redirect('/');
  }

  /*
    TODO [DB] : Replace the mock results with real ones.
    Please record the user vote into database.
    If the user already exists in the database, redirect her/him to '/'
  */

  //
  var vote = new Vote({vote: vote, fbid: fbid});
  vote.save(function(err, newVote){
      
      if( err ){ //conflict in fbid
        req.flash('info', "你已經投過票囉！");
        return res.redirect('/');
      }
      
  //
  //   Get all votes and do the statistics
  //

      if(totalVotes == 0) { //initialize
        for(var i = 0;i < numOfLevels;i++) {
          statisticalResult.push(0);
        }

        //async
        Vote.find(function(err, allVotes) {
          //console.log(allVotes);
          if(!err) { 
            var count = allVotes.length;

            //console.log(allVotes);

            for(var i = 0;i < count;i++) {
              statisticalResult[allVotes[i].vote]++;
            }

            doRendering(statisticalResult,count);
          }
          else {
            doRendering([0,0,0,0,0,0,0],1);
          }
        });

      }
      else {
        totalVotes++;
        statisticalResult[newVote.vote]++;
        doRendering(statisticalResult,totalVotes);
      }
      
      function doRendering(statisticalResult,totalVotes) {
        var renderedResult = [];
        for(var i=0;i<numOfLevels;i++) {
          renderedResult.push((statisticalResult[i]/totalVotes)*100);
        }

        res.render('result', {
          votes: renderedResult
        });
      }

      // test code
      // res.render('result', {
      //    votes: [18.1, 12.5, 42.44445, 21.3, 1.3, 2.5, 1.85555] // Percentages
      // });
  //
  });

});

//start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
