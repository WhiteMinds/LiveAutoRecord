import { Router } from 'express'

const router = Router()

router.route('/records').get(async (req, res) => {
  res.json({ payload: [] })
})

export { router }
