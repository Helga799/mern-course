const express = require('express');
const bcrypt = require('bcryptjs');
const {check, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken');
const cors = require('cors');

const mongoService = require('./services/mongo.service')

const config = require('./config/default.json');

const app = express();

app.use(express.json({ extended: true }))
app.use(cors())

// app.use('/api/auth', require('./routes/auht.routes'))
app.use('/api/link', require('./routes/link.routes'))
// app.use('/t', require('./routes/redirect.routes'))


const start = () => {
    return mongoService.connectToDatabase()
        .then(() => {
            const PORT = config.port || 5000;
            app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
            return Promise.resolve();
        })
        .then(() => {
            getRoutesBreweries();
            getRoutesUsers();
        })
}

const getRoutesBreweries = () => {
    app.get('/breweries', (req, res) => {
        const collection = mongoService.getDb().collection('breweries');

        collection.find({}).toArray()
            .then(docs => {
                res.status(200).send(docs);
            })
            .catch(err => {
                res.status(500).send(err);
            })
    });
}

const getRoutesUsers = () => {
    app.post('/api/auth/register',
        [
            check('email', 'incorrect email').isEmail(),
            check('password', 'minimum password length 6 characters')
                .isLength({min: 6})
        ],
        (req, res) => {
            console.log('Body:', req.body)
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Incorrect data during registration'
                })
            }

            if (req.body.password.length > 10) {
                return res.status(400).json({
                    message: 'Incorrect password'
                })
            }

            const collection = mongoService.getDb().collection('users');

            collection.findOne({email: req.body.email})
                .then(doc => {
                    if (doc) {
                        throw new Error('USER_EXISTS')
                    }
                    return bcrypt.hash(req.body.password, 12)
                })
                .then(hashedPassword => {
                    return collection.insertOne({
                        email: req.body.email,
                        password: hashedPassword
                    })
                })
                .then(result => {
                    console.debug(result)
                    res.status(200).send({message: 'You have successfully registered'})
                })

                .catch(err => {
                    if (err.message === 'USER_EXISTS') {
                        return res.status(400).send({message: 'User already exists'})
                    }
                    res.status(500).send(err);
                })
        });

    app.post('/api/auth/login', (req, res) => {
        const collection = mongoService.getDb().collection('users')
        collection.findOne({email: req.body.email})
            .then(doc => {
                if (!doc) {
                    return res.status(404).send({message: 'user not found'})
                }
                const check = bcrypt.compareSync(req.body.password, doc.password);
                console.log(check);
                if (!check) {
                    return res.status(401).send({message: 'password is not correct'})
                }

                const token = jwt.sign(
                    {
                        email: doc.email,
                        userId: doc._id
                    },
                    config.secret);
                console.log(token);
                console.log(doc.email, doc._id)

                return res.status(200).send({
                    token: token,
                    userId: doc._id
                })
            })
            .then()
            .catch(err => {
                console.log(err)
                return res.status(500).send(err)
            })

    });

    app.get('/me', (req, res) => {
        console.log(req.headers)
        const auth = req.headers.authorization
        const items = auth.split(' ');
        console.log(items[1]);

        const decoded = jwt.decode(items[1], {complete: true});

        const collection = mongoService.getDb().collection('users')
        collection.findOne({email: decoded.payload.email})
            .then(doc => {
                if (!doc) {
                    return res.status(404).send({message: 'user not found'})
                }
                return res.status(200).send(doc)
            })
            .catch(err => {
                console.log(err)
                return res.status(500).send(err)
            })
    })
}

start()
    .catch(err => console.log(err));
