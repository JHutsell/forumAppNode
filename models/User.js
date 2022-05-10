const validator = require('validator')

let User = function(data) {
  this.data = data
  this.errors = []
}

User.prototype.cleanUp = function() {
  if (typeof(this.data.username) != "string") {this.data.username = ""}
  if (typeof(this.data.username) != "string") {this.data.email = ""}
  if (typeof(this.data.username) != "string") {this.data.password = ""}

  // get rid of extra properties
  this.data = {
    username: this.data.username.trim().toLowercase(),
    email: this.data.email.trim().toLowercase(),
    password: this.data.password
  }
}

User.prototype.validate = function() {
  if (this.data.username == "") {this.errors.push("You must provide a username.")}
  if (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address.")}
  if (this.data.password == "") {this.errors.push("You must provide a password.")}

  if (this.data.password.length > 0 && this.data.password.length < 8) {this.errors.push("Password must be at least eight characters.")}
  if (this.data.password.length > 100) {this.errors.push("Password cannot exceed 100 characters.")}

  if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
  if (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least three characters.")}
  if (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters.")}
}

User.prototype.register = function() {
  // 1) validate user data
  this.cleanUp()
  this.validate()
  // 2) only if there are no validation errors, save user data into databse
}

module.exports = User