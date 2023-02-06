const mongoose = require('mongoose')
require('./config/db')
const express = require('express') 
const path = require('path')
const exphbs = require('express-handlebars');
require('dotenv').config({path: 'variables.env'})
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const bodyParser = require('body-parser')
const handlebars = require('handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')
const expressValidator = require('express-validator')
const flash = require('connect-flash')
const createError = require('http-errors')
const passport = require('./config/passport')

const router = require('./routes')

const app = express()

// Habilitar bodyPArser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extend: true}))

// validacion de campos
// app.use(expressValidator())

// habilitar handlebars como view
app.engine('handlebars',
    exphbs.engine({
        handlebars: allowInsecurePrototypeAccess(handlebars),
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
    // exphbs.engine({
    //     layoutsDir:'./views/layouts',
    //     defaultLayout: 'layout',
    //     extname: 'handlebars',
    //     runtimeOptions: {
    //         allowProtoMethodsByDefault: true,
    //         allowProtoMethodsByDefault: true
    //     },
    //     helpers: require('./helpers/handlebars')
    // })
)
app.set('view engine', 'handlebars')

// static files
app.use(express.static(path.join(__dirname,'public')))

app.use(cookieParser())

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.DATABASE})
}))

// inicializar passport
app.use(passport.initialize())
app.use(passport.session())

// alertas y flash messages
app.use(flash())

// crear nuestro middleware
app.use((req,res,next) => {
    res.locals.mensajes = req.flash()
    next()
})

app.use('/', router())

// 404 pagina no existente
app.use((req,res,next) =>{
    next(createError(404, 'No encontrado'))
})
//administracion de los errores
app.use((error,req,res,next) => {
    res.locals.mensaje = error.message
    const status = error.status || 500
    res.locals.status = status
    res.render('error')
})

const host = '0.0.0.0'
const port = process.env.PORT

app.listen(port,host, () => {
    console.log('El servidor esta corriendo')
})

