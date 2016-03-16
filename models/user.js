var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hostelType = {
  values: 'Girnar Udaigiri Satpura Zanskar Shivalik Vindhyanchal Jwalamukhi Aravali Karakoram Nilgiri Kumaon Kailash Himadri'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}
var categoryType = {
  values: 'StudentAdmin Student Solver'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

// set up a mongoose model and pass it using module.exports
var userSchema =new Schema({
    email: String,
    password: String,
    whoCreated:String,
    hostel: { type: String, enum: hostelType },
    category:{ type: String, enum: categoryType }
})
var User =mongoose.model('User', userSchema);
module.exports = User;
