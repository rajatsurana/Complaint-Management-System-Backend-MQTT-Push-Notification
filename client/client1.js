var mqtt = require('mqtt')
client = mqtt.connect({port:1883,host:'localhost'});
client.subscribe('presence');
console.log('Client publishing.. ');

client.publish('presence', 'Client 1 is alive.. Test Ping! ' + Date(),{qos:1,retain:false},function(err,data){
    console.log(data);
    //console.log('err: '+err);
});//,{qos:2,retain:true},cb

client.end();
