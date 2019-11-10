var Datastore = require('nedb');
db = new Datastore({ filename: './datafile', autoload: true });

db.insert({ "channel": "johnnicodes", "msg": "642701940857372672","id": "642334783073943552" });

db.findOne({ "channel": "johnnicodes" },(err, doc) => {
    console.log(doc.id);
});
exports.modules = { db }; 