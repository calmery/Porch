import express from 'express'
import path from 'path'
import passwordless from 'passwordless'
import MongoStore from 'passwordless-mongostore'
import  email from "emailjs"

const app = express()

// app.use(express.static( path.resolve( __dirname, 'public')))

// app.listen( 3000 )

var smtpServer  = email.server.connect({
   user:    yourEmail,
   password: yourPwd,
   host:    yourSmtp,
   ssl:     true
});

// Your MongoDB TokenStore
var pathToMongoDb = 'mongodb://mongo:27017';
passwordless.init(new MongoStore(pathToMongoDb));


passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        var host = 'localhost:3000';
        smtpServer.send({
            text:    'Hello!\nAccess your account here: http://'
            + host + '?token=' + tokenToSend + '&uid='
            + encodeURIComponent(uidToSend),
            from:    yourEmail,
            to:      recipient,
            subject: 'Token for ' + host
        }, function(err, message) {
            if(err) {
                console.log(err);
            }
            callback(err);
        });
});

app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({ successRedirect: '/'}));


/* GET login screen. */
router.get('/login', function(req, res) {
   res.render('login');
});

/* POST login details. */
router.post('/sendtoken',
    passwordless.requestToken(
        // Turn the email address into an user ID
        function(user, delivery, callback, req) {
            // usually you would want something like:
            User.find({email: user}, function(ret) {
               if(ret)
                  callback(null, ret.id)
               else
                  callback(null, null)
          })
          // but you could also do the following
          // if you want to allow anyone:
          // callback(null, user);
        }),
    function(req, res) {
       // success!
          res.render('sent');
});


// // GET login as above

// var users = [
//     { id: 1, email: 'marc@example.com' },
//     { id: 2, email: 'alice@example.com' }
// ];

// /* POST login details. */
// router.post('/sendtoken',
//     passwordless.requestToken(
//         function(user, delivery, callback) {
//             for (var i = users.length - 1; i >= 0; i--) {
//                 if(users[i].email === user.toLowerCase()) {
//                     return callback(null, users[i].id);
//                 }
//             }
//             callback(null, null);
//         }),
//         function(req, res) {
//             // success!
//         res.render('sent');
//

/* GET restricted site. */
router.get('/restricted', passwordless.restricted(),
 function(req, res) {
  // render the secret page
});

router.use('/admin', passwordless.restricted());

router.get('/admin', passwordless.restricted(),
    function(req, res) {
        res.render('admin', { user: req.user });
});

app.use(function(req, res, next) {
    if(req.user) {
        User.findById(req.user, function(error, user) {
            res.locals.user = user;
            next();
        });
    } else {
        next();
    }
})