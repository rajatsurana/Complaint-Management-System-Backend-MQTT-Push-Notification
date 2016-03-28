var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var solverType = {
  values: 'Electrician Carpenter Plumber LAN Other Warden Dean'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}
var statusType = {
  values: 'Filed Processing Resolved Discard'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

// set up a mongoose model and pass it using module.exports
var complaintSchema =new Schema({
    userId: String,
    solver: { type: String, enum: solverType },
    place: String,
    description: String,
    imageUrl:String,
    status:{ type: String, enum: statusType },
    topic:String
})
var Complaint =mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
//topic==Personal,<hostel>,Institute
