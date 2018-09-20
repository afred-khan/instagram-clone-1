const User = require("../models/user");
const passport = require("../passport");
const multer = require("multer");
const cloudinary = require("cloudinary");

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

const imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

cloudinary.config({
  cloud_name: "dmrien29n",
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

module.exports = router => {
  router.post("/register", upload.single("file"), (req, res) => {
    const { username, password } = req.body;

    console.log("user signup");
    if (req.file) {
      const file = req.file.path;

      cloudinary.v2.uploader.upload(file, (error, result) => {
        if (error) {
          res.send(error);
        } else {
          const public_id = result.public_id;
          const secure_url = result.secure_url;
          User.findOne({ username: username }, (err, user) => {
            if (err) {
              console.log("User.js post error: ", err);
            } else if (user) {
              res.json({
                error: "Username taken"
              });
            } else {
              const newUser = new User({
                username: username,
                password: password,
                avatar: secure_url,
                avatarId: public_id
              });
              newUser.save((err, savedUser) => {
                if (err) return res.json(err);
                res.json(savedUser);
              });
            }
          });
        }
      });
    } else {
      User.findOne({ username: username }, (err, user) => {
        if (err) {
          console.log("User.js post error: ", err);
        } else if (user) {
          res.json({
            error: "Username taken"
          });
        } else {
          const newUser = new User({
            username: username,
            password: password,
            avatar:
              "https://scontent-lax3-1.cdninstagram.com/vp/74d4a001973ffb1c519909dc584b0316/5C328D7A/t51.2885-19/11906329_960233084022564_1448528159_a.jpg"
          });
          newUser.save((err, savedUser) => {
            if (err) return res.json(err);
            res.json(savedUser);
          });
        }
      });
    }
  });

  router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.json({ message: info.message });
      }

      const userInfo = {
        id: user._id,
        username: user.username,
        avatar: user.avatar
      };
      res.send(userInfo);
    })(req, res, next);
  });

  router.get("/user", (req, res, next) => {
    console.log("===== user!!======");
    console.log(req.user);
    if (req.user) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  router.post("/logout", (req, res) => {
    req.logout();
    res.send({ msg: "logging out" });
  });
};