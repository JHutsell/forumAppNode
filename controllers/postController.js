const Post = require('../models/Post')

exports.viewCreateScreen = (req, res) => {
  res.render('create-post')
}

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id)
  post.create().then((newId) => {
    req.flash("success", "New Post successfully created!")
    req.session.save(() => res.redirect(`/post/${newId}`))
  }).catch((errors) => {
    errors.forEach((error) => req.flash("errors", error))
    req.session.save(() => res.redirect("/create-post"))
  })
}

exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', {post: post})
  } catch {
    res.render('404')
  }
}

exports.viewEditScreen = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render('edit-post', {post: post})
    } else {
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(() => res.redirect('/'))
    }
  } catch {
    res.render('404')
  }
}

exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id)
  post.update().then((status) => {
    //the post was successfully updated in db || user did have permission but there were validation errors
    if (status == "success") {
      //post was updated in db
      req.flash("success", "Post successfully updated!")
      req.session.save(() => {
        res.redirect(`/post/${req.params.id}/edit`)
      })
    } else {
      post.errors.forEach((error) => {
        req.flash("errors", error)
      })
      req.session.save(() => {
        res.redirect(`/post/${req.params.id}/edit`)
      })
    }
  }).catch(() => {
    // post with requested id doesnt exist || current visitor is not owner of post
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(() => {
      res.redirect('/')
    })
  })
} 

exports.delete = (req, res) => {
  Post.delete(req.params.id, req.visitorId).then(() => {
    req.flash("success", "Post successfully deleted!")
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  }).catch(() => {
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(() => res.redirect('/'))
  })
}

exports.search = (req, res) => {
  Post.search(req.body.searchTerm).then((posts) => {
    res.json(posts)
  }).catch(() => {
    res.json([])
  })
}