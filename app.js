const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const app = express()

let sessionOptions = session({
  secret: "Javascript is cool",
  store: MongoStore.create({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

app.use((req, res, next) => {
  // make markdown function avaialable in ejs templates
  res.locals.filterUserHTML = (content) => {
    return sanitizeHTML(markdown.parse(content), {
      allowedTags: sanitizeHTML.defaults.allowedTags.filter((tag) => tag !== 'a'), 
      allowedAttributes: {}
    })
  }


  //make all error and success flashes available in all templates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")

  //make current user id available on req object
  if (req.session.user) {req.visitorId = req.session.user._id} else {req.visitorId = 0}
  
  // make user session data available from within view templates
  res.locals.user = req.session.user
  next()
})

const router = require('./router')
// whatever is exported is stored in router variable

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use('/', router)

module.exports = app