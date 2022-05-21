const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const { render } = require('../app')

exports.mustBeLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    req.flash("errors", "You must be logged in to perform that action.")
    req.session.save(() => {
      res.redirect('/')
    })
  }
}

exports.login = (req, res) => {
  let user = new User(req.body)
  user.login().then(function(result) {
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(() => {
      res.redirect('/')
    })
  }).catch(function(e) {
    req.flash('errors', e)
    req.session.save(() => {
      res.redirect('/')
    })
  })
}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
  
}

exports.register = (req, res) => {
  let user = new User(req.body)
  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(() => {
      res.redirect('/')
    })
  }).catch((regErrors) => {
    regErrors.forEach((error) => {
      req.flash('regErrors', error)
    })
    req.session.save(() => {
      res.redirect('/')
    })
  })
  
}

exports.home = (req, res) => {
  if (req.session.user) {
    res.render('home-dashboard')
  } else {
    res.render('home-guest', {regErrors: req.flash('regErrors')})
  }
}

exports.ifUserExists = (req, res, next) => {
  User.findByUsername(req.params.username).then((userDocument) => {
    req.profileUser = userDocument
    next()
  }).catch(() => {
    res.render('404')
  })
}

exports.profilePostsScreen = (req, res) => {
  //ask post model for posts by certain author id
  Post.findByAuthorId(req.profileUser._id).then((posts) => {
    res.render('profile', {
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      currentPage: "posts",
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  }).catch(() => {
    res.render('404')
  })
}

exports.sharedProfileData = async (req, res, next) => {
  let isVisitorsProfile = false
  let isFollowing = false
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }

  req.isVisitorsProfile = isVisitorsProfile
  req.isFollowing = isFollowing
  //retrieve post, follower, and following count for user
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount
  next()
} 

exports.profileFollowersScreen = async (req, res) => {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile,
    followers: followers,
    currentPage: "followers",
    counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
  })
  } catch {
    res.render('404')
  }
}

exports.profileFollowingScreen = async (req, res) => {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id)
    res.render('profile-following', {
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile,
    following: following,
    currentPage: "following",
    counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
  })
  } catch {
    res.render('404')
  }
}
