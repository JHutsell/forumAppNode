const express = require('express')
const app = express()

const router = require('./router')
// whatever is exported is stored in router variable

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use('/', router)

app.listen(3000)