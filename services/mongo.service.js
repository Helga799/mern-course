const MongoClient = require('mongodb').MongoClient;
const config = require('../config/default.json');

let db;

const connectToDatabase = () => {
    return MongoClient.connect(config.mongoUri)
        .then(client => {
            db = client.db('test');
            return Promise.resolve();
        })
}

const getDb = () => {
    return db
}

module.exports = {
    connectToDatabase,
    getDb
}