const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const bcrypt = require('bcrypt')

const usuariosSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    nombre: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    token: String, 
    expira: Date,
    imagen: String
});

// Metodo para hashear passwords
usuariosSchema.pre('save', async function(next){
    console.log(this.isModified('password'))
    // si el password ya esta hasheado
    if(!this.isModified('password')){
        return next() // deten la ejecucion
    }

    // si no esta hasheado
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(this.password, salt)

    this.password = hash
    return next()
})
usuariosSchema.post('save', async function(error,doc,next){
    if(error.name === 'MongoError' && error.code === 11000){
        next('Ese correo ya esta registrado')
    }else{
        next(error)
    }
})

//autenticar usuarios
usuariosSchema.methods = {
    compararPassword: function(password){
        return bcrypt.compareSync(password, this.password)
    }
}

module.exports = mongoose.model('Usuarios', usuariosSchema)