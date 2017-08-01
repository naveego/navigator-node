var pub = require('./publishers');

var cli = new pub.PublisherClient({
  protocol: 'namedpipes',
  address: '\\\\.\\pipe\\test'
});


cli.testConnection({

    "server": "10.0.200.61",
    "db": "enerhub_synergy",
    "user": "sa",
    "pwd": "dev123!"

})
.then(function(data) {
  console.log("Success: ", data);
})
.catch(function(err) {
  console.log('Error: ', err);
})
