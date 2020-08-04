const {Router} = require('express')
const config = require('config')
const shortid = require('shortid')
const auth = require('../middleware/auth.middleware')
const ObjectId = require('mongodb').ObjectId;

const router = Router()

const mongoService = require('../services/mongo.service')

router.post('/generate', auth, async (req, res) => {
    try {
        const baseUrl = config.get('baseUrl')
        const {from} = req.body

        const code = shortid.generate()

        const db = mongoService.getDb()
        const collection = db.collection('links');

        const existing = await collection.findOne({from})

        if (existing) {
            return res.json({link: existing})
        }

        const to = baseUrl + '/t/' + code

        const doc = {
            code: code,
            to: to,
            from: from,
            owner: req.user.userId,
            click: 0,
            date: new Date()
        }
        const result = await collection.insertOne(doc)

        console.log(result)

        res.status(201).json(result)
    } catch (e) {
        res.status(500).json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

router.get('/', auth, async (req, res) => {
    try {
        const db = mongoService.getDb()
        const collection = db.collection('links')
        // const userId = new ObjectId()
        const links = await collection.find({owner: req.user.userId}).toArray()
        res.json(links)

    } catch (e) {
        console.log(e)
        res.status(500).json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

router.get('/:id', auth, async (req, res) => {
    try {
        const db = mongoService.getDb()
        const collection = db.collection('links')

        const id = new ObjectId(req.params.id);
        const item = {_id: id};
        const link = await collection.findOne(item)

        res.json(link)
    } catch (e) {
        console.log(e)
        res.status(500).json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

module.exports = router