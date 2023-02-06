const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')

exports.mostrarTrabajos = async (req,res, next) =>{
    const vacantes = await Vacante.find()
    // console.log(vacantes)
    if(!vacantes) return next()

    res.render('home',{
        nombrePagina: 'devJobs',
        tagline: 'Encuentra y Pública trabajos para desarrollo web',
        barra: true,
        boton: true,
        vacantes
    })
}

function challenge1(text){
    return text.split('').reverse().join('').split(' ').reverse().join(' ')
}

// console.log(challenge1('The quick brown fox'))