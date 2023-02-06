const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const slug = require('slug')
const shortid = require('shortid')
const { schema } = require('./Usuarios')

const VacantesSchema = new mongoose.Schema({
    titulo: {
        type: String,
        // required: true,
        trim: true
    },
    empresa: {
        type: String,
        trim: true
    },
    ubicacion: {
        type: String,
        trim: true,
        // required: true
    },
    salario: {
        type: String,
        default: 0,
        trim: true,
    },
    contrato: {
        type: String,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        lowercase: true
    },
    skills: [String],
    candidatos: [{
        nombre: String,
        email: String,
        cv: String
    }],
    autor: {
        type:  mongoose.Schema.ObjectId,
        ref: 'Usuarios',
        // required: true
    }
})

VacantesSchema.index({titulo: 'text'})

VacantesSchema.pre('save',function(next){

    // crear la url
    const url = slug(this.titulo)
    this.url = `${url}-${shortid.generate()}`

    next()
})

module.exports = mongoose.model('Vacante', VacantesSchema)