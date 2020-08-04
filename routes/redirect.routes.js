const {Router} = require('express')
const Link = require('../routes/link.routes')
const router = Router()

const mongoService = require('../services/mongo.service')


router.get('/:code', async (req, res) => {
    try{
      const db = mongoService.getDb()
      const collection = db.collection('links')

      const link = await collection.findOne({code: req.params.code})

      if (link) {
          link.click++
          await link.save()
          return res.redirect(link.from)
      }
      res.status(404).json('Ссылка не найдена')

    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Что-то пощло не так, попробуйте снова'})
    }
})

module.exports = router