const User = require('../models/User')

exports.login = (req, res) => {
  let user = new User(req.body)
  user.login().then(function(result) {
    req.session.user = {username: user.data.username}
    req.session.save(() => {
      res.redirect('/')
    })
  }).catch(function(e) {
    res.send(e)
  })
}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
  
}

exports.register = (req, res) => {
  let user = new User(req.body)
  user.register()
  if (user.errors.length) {
    res.send(user.errors)
  } else {
    res.send("Congrats, no errors")
  }
}

exports.home = (req, res) => {
  if (req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username})
  } else {
    res.render('home-guest')
  }
}