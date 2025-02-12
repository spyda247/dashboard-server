import express, { json } from "express"
import { promises as fs } from "fs"
import cors from "cors"
import ShortUniqueId from "short-unique-id"
import { createClient } from "redis"
const redis = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect()
const app = express()
const port = process.env.PORT || 3003

app.use(cors())
app.use(json())

app.get("/", (req, res) => {
  res.send("Welcome to BadRock")
})
app.get("/get-data", async (req, res) => {
  try {
    const matchingKeys = await redis.keys("user*")
    let dt = matchingKeys.map((key) => redis.get(key))
    Promise.all([...dt]).then((values) => {
      let dtObj = values.map((item) => JSON.parse(item))
      res.send(dtObj)
    })
  } catch (error) {
    console.log("can not find data", error.message)
    res.send({})
  }
})
app.post("/add-data", async (req, res) => {
  try {
    req.body.id = generateUniqueId()
    redis.set(`user${req.body.id}`, JSON.stringify(req.body))
    sendResponse(res, "Data added successfully")
  } catch (error) {
    errorMsg(res, error, "Error updating data")
  }
})
app.post("/update-data", async (req, res) => {
  try {
    const matchingKeys = await redis.keys("user*")
    let dt = matchingKeys.map((key) => redis.get(key))
    Promise.all([...dt]).then((values) => {
      let dtObj = values.map((item) => JSON.parse(item))
      const index = dtObj.findIndex((item) => item.id === req.body.id)
      if (index === -1) {
        console.log("Data not found")
        return res
          .status(404)
          .json({ success: false, message: "Data not found" })
      } else {
        console.log("Data found")
        if (req.body.index === 0) {
          dtObj[index]["name"] = req.body.value
        } else if (req.body.index === 1) {
          dtObj[index]["role"] = req.body.value
        } else if (req.body.index === 2) {
          dtObj[index]["subject"] = req.body.value
        } else {
          console.log("Invalid index")
        }
      }
      console.log(JSON.stringify(dtObj))
      redis.set(matchingKeys[index], JSON.stringify(dtObj[index]))
      sendResponse(res, "Data updated successfully")
    })
  } catch (error) {
    errorMsg(res, error, "Error updating data")
  }
})
app.post("/delete-data", async (req, res) => {
  try {
    let newJsonData = []
    const matchingKeys = await redis.keys("user*")
    let dt = matchingKeys.map((key) => redis.get(key))
    Promise.all([...dt]).then((values) => {
      let dtObj = values.map((item) => JSON.parse(item))
      const index = dtObj.findIndex((item) => item.id === req.body.id)
      if (index === -1) {
        console.log("Data not found")
        return res
          .status(404)
          .json({ success: false, message: "Data not found" })
      } else {
        redis.del(matchingKeys[index])
        sendResponse(res, "Data deleted successfully")
      }
    })
  } catch (error) {
    errorMsg(res, error, "Error updating data")
  }
})
app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})
export default app
async function sendResponse(res, message) {
  res.json({ success: true, message: message })
}
function generateUniqueId() {
  const { randomUUID } = new ShortUniqueId()
  return randomUUID()
}
function errorMsg(res, error, message) {
  console.error(`${message}:`, error)
  res.status(500).json({ success: false, message: message })
}
