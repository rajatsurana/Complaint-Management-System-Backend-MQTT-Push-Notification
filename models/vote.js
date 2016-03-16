var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userVoteSchema = new Schema({ userId: String, upVote: Boolean }, { noId: true });
// set up a mongoose model and pass it using module.exports
var voteSchema =new Schema({
    complaintId:String,
    canVote:Boolean,
    up:Number,
    down:Number,
    userVotesArr :[userVoteSchema]
})
var Vote =mongoose.model('Vote', voteSchema);
module.exports = Vote;
