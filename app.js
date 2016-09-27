var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var mongoose   = require('mongoose');
var router = express.Router();
var config = require('./config');
var passport = require('passport');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var LocalStrategy   = require('passport-local').Strategy;
var User   = require('./models/user');
var Vote  = require('./models/vote');
var Complaint = require('./models/complaint');// get our mongoose model
var fs = require('fs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('tiny'))
app.use(passport.initialize());
mongoose.connect(config.database);
app.set('superSecret', config.secret);

var mosca = require('mosca')
var mqtt = require('mqtt')
var ascoltatore = {
  //using ascoltatore
  type: 'mongo',
  url: config.database,
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

var moscaSettings = {
  port: 1883,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: config.database
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

passport.use('local-login',new LocalStrategy(
    {
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : false
    },
    function(email, password, done)
    {
        User.findOne({ 'email': email }, function(err, user)
        {
            //console.log('rajat: '+email + user.password);
            if (err) {
                //console.log('rajat: '+err);
                return done(err); }
            if (!user)
            {

                return done(null, false, { message: 'incorrect_username' });
            }
            if (!user.validPassword(password))
            {
                //console.log('rajat: Incorrect pass');
                return done(null, false, { message: 'incorrect_password' });
            }
            return done(null, user);
        });
    }
));
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});
/*
router.route('/login')
.post(function(req, res) {
  User.findOne({email:req.body.email}, function(err, user) {
      if(user!=null){
          if(user.password==req.body.password){
              res.json({message:'success', user:user, token:"token"});
          }else{
              res.json({message:'username or password not match'});
          }
      }else{
          res.json({message:'user not exist'});
      }
  });
);
*/


router.post('/login', function(req, res, next)
{
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            return res.json(401, { error: 'no_user_found_ask_admin' });
        }

        var token = jwt.sign(user, app.get('superSecret'), {
            expiresIn: 24*60*60 // expires in 24 hours
        });
        res.json({ token : token, user:user});

    })(req, res, next);
});





router.route('/users')
.get( function(req, res) {
  User.find({}, function(err, users) {
      if (err)
      {
          res.send(err)
      }
    res.json({users : users});
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
                  user.password = user.generateHash(req.body.password) || 'default',
                  user.hostel=req.body.hostel||'default',
                  user.category=req.body.category||'default',
                  user.whoCreated=req.body.whoCreated||'default'
            user.save(function(err) {
                if (err){
                    res.send(err);
                }

                res.json({ message: 'user_created', user: user});
            });
        }else{
            res.json({message:'user_already_exists'});
        }
    });
});

router.route('/findUsers/:whoCreated')
.get( function(req, res) {

  User.find({whoCreated:req.params.whoCreated}, function(err, users) {
      if (err)
      {
          res.send(err)
      }
      if(users!=null){
          res.json({message:'users_found',users:users});
      }else{
          res.json({message:'no_users_found'});
      }
  });
});

router.route('/deleteUser')
.post(function(req, res)
{
    User.findOne({email:req.body.email,password:user.generateHash(req.body.password)}, function(err, user) {
        if (err)
        {
            res.send(err)
        }
        if(user!=null){
        user.remove(function(err) {
            if (err) throw err;
        res.json({message:'user_deleted'});
        });
        }else{
            res.json({message:'username_or_password_incorrect'});
        }
    });
});
router.route('/changePassword')
.post(function(req, res)
{
    User.findOne({email:req.body.email}, function(err, user) {
        if (err)
        {
            res.send(err)
        }
        if(user!=null){
          if(user.validPassword(req.body.password)){
            user.password=user.generateHash(req.body.newPassword);
            user.save(function(err) {
                if (err) throw err;
                res.json({message:'password_changed',user:user});
            });
          }else{
            console.log("password_incorrect");
            res.json({message:'password_incorrect'});

          }


        }else{
            res.json({message:'username_or_password_incorrect'});
        }
    });
});
router.route('/myComplaints/:userId')
.get(function(req, res)
{
    Complaint.find({userId:req.params.userId}, function(err, complaints) {
        if (err)
        {
            res.send(err)
        }
        if(complaints.length!=0){//complaints!=null

            res.json({message:'complaints_found', complaints:complaints});
        }else{
            res.json({message:'no_complaints_found'});
        }
    });
});

router.route('/newComplaint')
.post(function(req, res)
{
    var complaint = new Complaint();
          complaint.userId = req.body.userId || 'default',
          complaint.solver = req.body.solver || 'Other',
          complaint.place = req.body.place||'default',
          complaint.description = req.body.description||'default',
          //complaint.imageUrl = req.body.imageUrl||'default',
          complaint.status = 'Filed'
          if(req.body.solver == 'Dean'){
              complaint.topic= 'Institute';
          }else if(req.body.solver == 'Warden'){
              complaint.topic=req.body.hostel;
          }else{
              complaint.topic= 'Personal';
          }
          //JSON.parse(req.body.topics)

    complaint.save(function(err) {
        if (err){
            res.send(err);
        }
        //

        var imageBuffer = new Buffer(req.body.imageFile, 'base64')//decodeBase64Image(req.body.imageFile);
        //console.log(imageBuffer);
        var dir =__dirname+"/uploads/images/complaints/"+complaint.userId+"/";
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        fs.writeFile(dir+complaint._id+".png", imageBuffer, function(err) {
            if(err){
            //res.json({'response':"Error"});
            }else {
            //res.json({'response':"Saved"});
            }
        });
        //
        //create voteObject************************************if not personal
        if(complaint.solver== 'Warden' || 'Dean'){
            var vote= new Vote();
              vote.complaintId=complaint._id;
              vote.canVote=true;
              vote.up=0;
              vote.down=0;
              vote.userVotesArr=[];
              vote.save(function(err){
                  if (err){
                      res.send(err);
                  }
                  res.json({ message: 'complaint_created', complaint: complaint, vote:vote});
              });
        }else{
            res.json({ message: 'complaint_created', complaint: complaint});
        }


    });
});
router.route('/searchComplaints/:userId/:topic')
.get(function(req, res)
{
    Complaint.find({topic:req.params.topic,userId:req.params.userId}, function(err, complaints) {
        if (err)
        {
            res.send(err)
        }
        if(complaints.length!=0){

            res.json({message:'complaints_found', complaints:complaints});
        }else{
            res.json({message:'no_complaints_found'});
        }
    });
});
router.route('/noOfVotes/:complaintId')
.get(function(req, res)
{
    Vote.findOne({complaintId:req.params.complaintId}, function(err, vote) {
        if (err)
        {
            res.send(err)
        }
        if(vote!=null){

            res.json({message:'vote_found',noOfVote:vote.up});
        }else{
            res.json({message:'vote_not_found'});
        }
    });
});

router.route('/solverComplaints/:solver')
.get(function(req, res)
{
    if(req.params.solver=='Warden' || req.params.solver=='Dean'){
    Complaint.find({solver:req.params.solver}, function(err, complaints) {
        if (err)
        {
            res.send(err)
        }
        if(complaints.length!=0){

            res.json({message:'complaints_found', complaints:complaints});
        }else{
            res.json({message:'no_complaints_found'});
        }
    });
}else{
    var solverArray=['Electrician','Carpenter','Plumber','LAN','Other'];
    Complaint.find({solver:{ $in : solverArray }}, function(err, complaints) {
        if (err)
        {
            res.send(err)
        }
        if(complaints.length!=0){

            res.json({message:'complaints_found', complaints:complaints});
        }else{
            res.json({message:'no_complaints_found'});
        }
    });
}
});
router.route('/allComplaints')
.get(function(req, res)
{
    Complaint.find({}, function(err, complaints) {
        if (err)
        {
            res.send(err)
        }
        if(complaints.length!=0){

            res.json({message:'complaints_found', complaints:complaints});
        }else{
            res.json({message:'no_complaints_found'});
        }
    });
});
router.route('/changeComplaintStatus')
.post(function(req, res)
{
    Complaint.findOne({ _id:req.body.complaintId}, function(err, complaint) {
        if (err)
        {
            res.send(err)
        }
        if(complaint!=null){
            complaint.status=req.body.status;
            complaint.save(function(err) {
                if (err){
                    res.send(err);
                }

                res.json({ message: 'complaint_status_updated', complaint:complaint});
            });
        }else{
            res.json({message:'no_complaint_found'});
        }
    });
});
router.route('/complaintDescription/:complaintId')
.get(function(req, res)
{
    Complaint.findOne({ _id:req.params.complaintId}, function(err, complaint) {
        if (err)
        {
            res.send(err)
        }
        if(complaint!=null){
            res.json({message:'complaint_found',complaint:complaint});
        }else{
            res.json({message:'no_complaint_found'});
        }
    });
});
router.route('/deleteComplaint')
.post(function(req, res)
{
    Complaint.findOne({ _id:req.body.complaintId, userId:req.body.userId}, function(err, complaint) {
        if (err)
        {
            res.send(err)
        }
        if(complaint!=null){
        complaint.remove(function(err) {
            if (err) throw err;
            res.json({message:'complaint_successfully_deleted'});
        });
        }else{
            res.json({message:'complaint_not_exist'});
        }
    });
});

router.route('/vote')
.post(function(req, res)
{
    Vote.findOne({ complaintId:req.body.complaintId}, function(err, vote) {
        if (err)
        {
            res.send(err)
        }
        if(vote!=null){
            if(vote.canVote==true){
                var voted=false;
                for(var z=0; z<vote.userVotesArr.length;z++){
                    if(vote.userVotesArr[z].userId==req.body.userId){
                        voted=true;
                        if(vote.userVotesArr[z].upVote==true){
                            if(req.body.upVote=='false'){
                                vote.userVotesArr[z].upVote=false;
                                vote.down++;
                                vote.up--;
                            }else{
                                //vote.userVotesArr[z].upVote=true;
                                //vote.up++;
                                //vote.down--;
                            }
                        }else{
                            if(req.body.upVote=='true'){
                                vote.userVotesArr[z].upVote=true;
                                vote.down--;
                                vote.up++;
                            }else{
                                //vote.userVotesArr[z].upVote=true;
                                //vote.up++;
                                //vote.down--;
                            }
                        }
                        break;
                    }
                }
                if(voted==false){
                    if(req.body.upVote=='true'){
                        vote.up++;
                        vote.userVotesArr.push({userId:req.body.userId,upVote:true});
                    }else{
                        vote.down++;
                        vote.userVotesArr.push({userId:req.body.userId,upVote:false});
                    }
                }
                vote.save(function(err) {
                    if (err){
                        res.send(err);
                    }

                    res.json({ message: 'voted_success', vote: vote});
                });
            }else{
                res.json({message:'voting_over'});//if canVote==false
            }
        }else{
            res.json({message:'no_voting_started'});
        }
    });
});
router.route('/voteStatusChange')
.post(function(req, res)
{
    Vote.findOne({ complaintId:req.body.complaintId}, function(err, vote) {
        if (err)
        {
            res.send(err)
        }
        if(vote!=null){
            if(req.body.canVote=='true'){
                vote.canVote=true;
            }else{
                vote.canVote=false;
            }
            vote.save(function(err) {
                if (err){
                    res.send(err);
                }

                res.json({ message: 'vote_status_changed', vote: vote});
            });
        }else{
            res.json({message:'no_voting_started'});
        }
    });
});

/*
router.route('/changePersonalComplaintStatus')
.post(function(req, res)
{
    Complaint.findOne({ _id:req.body.complaintId}, function(err, complaint) {
        if (err)
        {
            res.send(err)
        }
        if(complaint!=null){
            complaint.status=req.body.status;
            complaint.save(function(err) {
                if (err){
                    res.send(err);
                }

                res.json({ message: 'status updated', status:complaint.status});
            });
        }else{
            res.json({message:'no complaint found'});
        }
    });
});
*/
router.post('/upload', function(req, res) {
    //
var userId=req.body.userId;
//console.log(userId);
var complaintId=req.body.complaintId;
//console.log(complaintId);
var separator="/";
var imageBuffer = new Buffer(req.body.imageFile, 'base64')//decodeBase64Image(req.body.imageFile);
//console.log(imageBuffer);
var dir =__dirname+"/uploads/images/complaints/"+userId+"/";
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
fs.writeFile(dir+complaintId+".png", imageBuffer, function(err) {
    if(err){
    res.json({'response':"Error"});
    }else {
    res.json({'response':"Saved"});
    }
});

/*
console.log(req.body.image+" :rajat");
console.log(req.files.image.originalFilename);
console.log(req.files.image.path);
    //var userId=req.body.userId;
    //var complaintId = req.body.complaintId;
    fs.readFile(req.files.image.path, function (err, data){
        var dirname = "/images/complaints/"+"1/3.png";//+userId+"/"+complaintId
        var newPath =  __dirname+"/uploads"+ dirname;//+ req.files.image.originalFilename;
        fs.writeFile(newPath, data, function (err) {
            if(err){
            res.json({'response':"Error"});
            }else {
            res.json({'response':"Saved"});
            }
        });
    });
*/
});
router.get('/downloads/:userId/:complaintId', function (req, res){//:file/:userId/:complaintId..get
        //file = req.params.file;
        var userId=req.params.userId;
        var complaintId = req.params.complaintId;
        var dirname = "/uploads/images/complaints/"+userId+"/"+complaintId+".png";
        if (fs.existsSync( __dirname+dirname)){
            var img = fs.readFileSync( __dirname+dirname);
            res.writeHead(200, {'Content-Type': 'image/png' });
            res.end(img, 'binary');
        }


});
/*
function decodeBase64Image(dataString) {
    console.log("rajat: "+dataString.length);
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}
*/
//change password, add comments

app.use('/api', router);
app.listen(3000);
console.log('Magic happens on port 3000');
