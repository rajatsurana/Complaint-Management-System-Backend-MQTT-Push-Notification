var mqtt = require('mqtt')
client = mqtt.connect({port:1883,host:'localhost'});
client.subscribe('presence');
client.on('message', function(topic, message) {
console.log(message +"");
});
console.log('Client started...');
