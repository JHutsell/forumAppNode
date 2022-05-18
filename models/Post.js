const postsCollection = require('../db').db().collection("posts")
const ObjectID = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestedPostId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Post.prototype.cleanup = function() {
  if (typeof(this.data.title) != "string") {this.data.title = ""}
  if (typeof(this.data.body) != "string") {this.data.body = ""}

  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}), 
    body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}), 
    createdDate: new Date(), 
    author: ObjectID(this.userid)
  }
}

Post.prototype.validate = function() {
  if (this.data.title == "" ) {this.errors.push("You must provide a title.")}
  if (this.data.body == "" ) {this.errors.push("You must provide post content.")}
}

Post.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanup()
    this.validate()
    if (!this.errors.length) {
      // save post into db
      postsCollection.insertOne(this.data).then((info) => {
        resolve(info.insertedId)
      }).catch(() => {
        this.errors.push("Please try again later.")
        reject(this.errors)
      })
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid)
      if (post.isVisitorOwner) {
        //update db
        let status = await this.updateDb()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.updateDb = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanup()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Post.reusablePostQuery = (uniqueOperations, visitorId, finalOperations = []) => {
  return new Promise(async (resolve, reject) => {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]}
      }}
    ]).concat(finalOperations)

    let posts = await postsCollection.aggregate(aggOperations).toArray()

    //cleanup author property in post object
    posts = posts.map((post) => {
      post.isVisitorOwner = post.authorId.equals(visitorId)
      post.authorId = undefined
      
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })
    resolve(posts)
  })
}

Post.findSingleById = (id, visitorId) => {
  return new Promise(async (resolve, reject) => {
    if (typeof(id) != "string" || !ObjectID.isValid(id)) {
      reject()
      return 
    }
    
    let posts = await Post.reusablePostQuery([
      {$match: {_id: new ObjectID(id)}}
    ], visitorId)

    if (posts.length) {
      //console.log(posts[0])
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = (authorId) => {
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

Post.delete = (postId, currentUserId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postId, currentUserId)
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({_id: new ObjectID(postId)})
        resolve()
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.search = (searchTerm) => {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) == "string") {
      let posts = await Post.reusablePostQuery([
        {$match: {$text: {$search: searchTerm}}}
      ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
      resolve(posts)
    } else {
      reject()
    }
  })
}

module.exports = Post