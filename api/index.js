const express = require("express")
const fs = require("fs").promises
const path = require("path")
const cors = require("cors")
const app = express()
const port = process.env.PORT || 3003

const ShortUniqueId = require("short-unique-id")
function generateUniqueId() {
  const { randomUUID } = new ShortUniqueId()
  return randomUUID()
}
async function getdata() {
  const dataPath = path.join(__dirname, "data.json")
  const data = await fs.readFile(dataPath, "utf8")
  const jsonData = JSON.parse(data)
  return [jsonData, dataPath]
}
async function writeData(res, dataPath, data, message) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
  res.json({ success: true, message: message })
}
function errorMsg(res, error, message) {
  console.error(`${message}:`, error)
  res.status(500).json({ success: false, message: message })
}

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Welcome to BadRock")
})

app.get("/get-data", async (req, res) => {
  try {
    const [jsonData, dataPath] = await getdata()
    res.send(jsonData)
  } catch (error) {
    console.log("can not find data", error.message)
    res.send({})
  }
})
app.post("/add-data", async (req, res) => {
  try {
    const [jsonData, dataPath] = await getdata()
    req.body.id = generateUniqueId()
    jsonData.push(req.body)
    writeData(res, dataPath, jsonData, "Data added successfully")
  } catch (error) {
    errorMsg(res, error, "Error updating data")
  }
})
app.post("/update-data", async (req, res) => {
  try {
    const [jsonData, dataPath] = await getdata()
    const index = jsonData.findIndex((item) => item.id === req.body.id)
    if (index === -1) {
      console.log("Data not found")
      return res.status(404).json({ success: false, message: "Data not found" })
    } else {
      console.log("Data found")
      if (req.body.index === 0) {
        jsonData[index]["name"] = req.body.value
      } else if (req.body.index === 1) {
        jsonData[index]["role"] = req.body.value
      } else if (req.body.index === 2) {
        jsonData[index]["subject"] = req.body.value
      } else {
        console.log("Invalid index")
      }
    }
    writeData(res, dataPath, jsonData, "Data updated successfully")
  } catch (error) {
    errorMsg(res, error, "Error updating data")
  }
})
app.post("/delete-data", async (req, res) => {
  try {
    const [jsonData, dataPath] = await getdata()
    let newJsonData = []
    const index = jsonData.findIndex((item) => item.id === req.body.id)
    if (index === -1) {
      console.log("Data not found")
      return res.status(404).json({ success: false, message: "Data not found" })
    } else {
      newJsonData = jsonData.filter((data) => data.id !== req.body.id)
    }
    writeData(res, dataPath, newJsonData, "Data deleted successfully")
  } catch (error) {
    errorMsg(res, error, "Error updating data")
  }
})
app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})

module.exports = app
