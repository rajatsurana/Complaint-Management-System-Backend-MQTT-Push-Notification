var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var Product = require('./models/product');
var mongoose   = require('mongoose');
var router = express.Router();
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens

var User   = require('./models/user');
var Vote  = require('./models/vote');
var Complaint = require('./models/complaint');// get our mongoose model
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/compMSysBackend');

var mosca = require('mosca')
var mqtt = require('mqtt')
var ascoltatore = {
  //using ascoltatore
  type: 'mongo',
  url: 'mongodb://localhost/compMSysBackend',
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

var moscaSettings = {
  port: 1883,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: 'mongodb://localhost/compMSysBackend'
  }
};
var settings = {
  port: 1883,
  persistence: mosca.persistence.Memory
};
var server = new mosca.Server(moscaSettings);

server.on('ready', setup);
server.published = function(packet, client, cb) {
  if (packet.topic.indexOf('echo') === 0) {
    return cb();
  }

  var newPacket = {
    topic: 'echo/' + packet.topic,
    payload: packet.payload,
    retain: packet.retain,
    qos: packet.qos
  };

  console.log('newPacket', newPacket);

  server.publish(newPacket, cb);
}
server.on('clientConnected', function(client) {
    console.log('client connected', client.id+" rajat");

});

// fired when a message is received
server.on('published', function(packet, client) {
  console.log('Published', packet.payload+"");

});
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
  console.log('subscribed : ', topic);
});

// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
  console.log('unsubscribed : ', topic);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
  console.log('clientDisconnecting : ', client.id);
});

// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
  console.log('clientDisconnected : ', client.id);
});
// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
}

app.get('/setup', function(req, res) {
  // create sample users
  var rajat = new User({
    email: 'Rajat',
    password: 'pass'
  });
  var ujjawal = new User({
    email: 'Ujjawal',
    password: 'pass2'
  });
  // save the sample users
  rajat.save(function(err) {
    if (err) throw err;

    console.log('User1 saved successfully');
    res.json({ success: true });
  });
  ujjawal.save(function(err) {
    if (err) throw err;

    console.log('User2 saved successfully');
    res.json({ success: true });
  });
});
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

router.route('/login')
.post(function(req, res) {
  User.findOne({email:req.body.email}, function(err, user) {
      if(user!=null){
          if(user.password==req.body.password){
              res.json({message:'success', user:user});
          }else{
              res.json({message:'username or password not match'});
          }
      }else{
          res.json({message:'user not exist'});
      }
  });
);

router.route('/users')
.get( function(req, res) {
  User.find({}, function(err, users) {

    res.json({Users : users});
  });
})
.post( function(req, res) {
    User.findOne({email:req.body.email}, function(err, userN) {
        if (err)
        {
            res.send(err)
        }
        if (userN==null){
            var user = new User();
                  user.email = req.body.email || 'default',
                  user.password = req.body.password || 'default',
                  user.hostel=req.body.hostel||'default',
                  user.category=req.body.category||'default',
                  user.whoCreated=req.body.whoCreated||'default'
            user.save(function(err) {
                if (err){
                    res.send(err);
                }

                res.json({ message: 'user created', user: user});
            });
        }else{
            res.json({message:'user already exists'});
        }
    });
});

router.route('/findUser')
.post( function(req, res) {

  User.findOne({email:req.body.email}, function(err, user) {
      if (err)
      {
          res.send(err)
      }
      if(user!=null){
          res.json({user:user});
      }else{
          res.json({message:'user not exist'});
      }
  });
});

router.route('/deleteUser')
.post(function(req, res)
{
    User.findOne({email:req.body.email,password:req.body.password}, function(err, user) {
        if (err)
        {
            res.send(err)
        }
        if(user!=null){
        user.remove(function(err) {
            if (err) throw err;
        res.json({message:'User successfully deleted!'});
        });
        }else{
            res.json({message:'Username or password incorrect'});
        }
    });
});

app.use('/api', router);
app.listen(3000);
console.log('Magic happens on port 3000');
