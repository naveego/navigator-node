var pub = require('./publishers');

var cli = new pub.PublisherClient({
  protocol: 'unix',
  address: '/tmp/bogus2.sock'
});


cli.testConnection({})
.then(function(data) {
  console.log("Success: ", data);
})
.catch(function(err) {
  console.log('Error: ', err);
})
