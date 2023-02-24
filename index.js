const express = require('express')
const app = express()
const cors = require('cors')
const User = require('./models/User')
const Post = require('./models/Post')
const bcrypt = require('bcryptjs')
const connectDB = require('./dbConn')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs')
const scanResume = require('./scanResume')
const scanResumeText = require('./scanResumeText')
require('dotenv').config()

const salt = bcrypt.genSaltSync(10)
const secret = process.env.SECRET

app.use(cors({credentials:true,origin:'https://skillglance.onrender.com'})) //middleware
// app.use(cors({credentials:true,origin:'http://localhost:3000'})) //middleware
app.use(express.json()) //middleware
app.use(cookieParser())

connectDB()

app.post('/register', async (req,res) => {
    const {username, password} = req.body;

    try{
        const userDoc = await User.create({
            username, 
            password: bcrypt.hashSync(password, salt)
        }); //create is async!
        res.json(userDoc)
    }catch(e){
        res.status(400).json(e);
    }
});

app.post('/login', async (req,res) => {
    const {username, password} = req.body
    const userDoc = await User.findOne({username})
    const authenticate = bcrypt.compareSync(password, userDoc.password)
    
    if (authenticate) {
        //logged in
        // use callback here but then or await will work too
        jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
            if (err) {
                return err
            }
            res.cookie('token', token).json({
                id:userDoc._id,
                username
            })
        })

    } else {
        res.status(400).json("wrong credentials");
    }
});

app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
        if (err) throw err;
        res.json(info);
    });
  });
  
app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', async (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err;
        const {title,summary,content} = req.body;
        console.log(content)
        if (!title || !summary ){
            return res.status(400).json("Input missing.")
        }
        const postDoc = await Post.create({ //async function
            title,
            summary,
            content,
            author: info.id
        })
        res.json(postDoc)  
    });
});

//update post
app.put('/post', async (req,res) => {
    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err
        const {id,title,summary,content} = req.body
        if (!title || !summary ){
            return res.status(400).json("Input missing.")
        }
        const postDoc = await Post.findById(id)
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id)
        if (!isAuthor) {
            return res.status(400).json('you are not the author')
        }
        await postDoc.update({
            title,
            summary,
            content,
        })
        res.json(postDoc)   
    })
  
})

//get post for index page
app.get('/post', async (req, res) => {
    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) { return res.status(401).json('invalid token') }
        res.json(
            await Post.where('author').equals(info.id)
                .populate('author', ['username']) //don't include password of author
                .sort({createdAt: -1})
                .limit(20)
        )
    })
})

//get post for post page
app.get('/post/:id', async (req, res) => {
    const {token} = req.cookies
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) {
            return res.status(401).json('invalid token')
        }
        const {id} = req.params //access the parameters of the current URL
        const post = await Post.findById(id)
        const isAuthor = JSON.stringify(post['author']) === JSON.stringify(info.id) //only get author id
        if (!isAuthor) {
            return res.status(400).json('you are not the author')
        }
        
        const postDoc = await Post.findById(id).populate('author', ['username']); //hide password
        res.json(postDoc)
    })
})

//upload resume and post for scanning
app.post('/scan', uploadMiddleware.single('file'), async (req,res) => {
    const {jobTitle, jobDesc} = req.body
    if (!jobTitle || !jobDesc || !req.file){
        return res.status(400).json("Input missing.")
    }
    const {originalname, path} = req.file
    const parts = originalname.split('.')
    const ext = parts[parts.length - 1]
    if (ext != "pdf"){  return res.status(400).json("Wrong file type.") }
    const newPath = path+'.'+ext
    fs.renameSync(path, newPath)
    const matches = await scanResume(newPath, jobDesc)
    res.json(matches)
});

//upload resume and post in text format for scanning
app.post('/scan-text', async (req,res) => {
    const {jobTitle, jobDesc, content} = req.body
    if (!jobTitle || !jobDesc || !content){
        return res.status(400).json("Input missing.")
    }
    const matches = await scanResumeText(content, jobDesc)
    // console.log(req.body)
    res.json(matches)
});

app.listen(4000);
