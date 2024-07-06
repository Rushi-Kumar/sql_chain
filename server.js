import express from 'express'
import Controller from './controller.js'

const app = express()
const port = 6000

const controller = new Controller();

app.get('/api/v0.0.1/sqlchain/ask', async (req, res) => {
  const { question } = req.query;
  try {
    const response = await controller.run(question);
    res.send(response);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
 
})


app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Example app listening at http://0.0.0.0:${port}`)
})