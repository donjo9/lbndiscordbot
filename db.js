var Datastore = require('nedb');
db = new Datastore({ filename: './datafile', autoload: true });

db.insert({ "channel": "johnnicodes", "id": "642334783073943552" });

db.findOne({ "channel": "johnnicodes" },(err, doc) => {
    console.log(doc.id);
});
exports.modules = { db }; 