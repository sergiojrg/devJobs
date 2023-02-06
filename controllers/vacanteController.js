// const Vacante = require('../models/Vacantes')
const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')
const { check, validationResult } = require('express-validator')
const multer = require('multer')
const shortid = require('shortid')


exports.formularioNuevaVacante = (req, res) => {
    res.render('nueva-vacante',{
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.agregarVacante = async(req, res) => {
    const vacante = new Vacante(req.body)

    // agregar autor
    vacante.autor = req.user._id

    // Crear arreglo de habilidades
    vacante.skills = req.body.skills.split(',')

    // almacenar en la base de datos
    const nuevaVacante = await vacante.save()

    res.redirect(`/vacantes/${nuevaVacante.url}`)
}

exports.mostrarVacante = async(req, res, next) => {
    const { url } = req.params

    const vacante = await Vacante.findOne({url}).populate('autor', '-password')

    if(!vacante) return next()

    res.render('vacante',{
        vacante,
        nombrePagina: `Vacante ${vacante.titulo}`,
        barra: true,
    })
}

exports.formEditarVacante = async (req,res,next) => {
    const { url } = req.params
    const vacante = await Vacante.findOne({url})

    if(!vacante) return next()

    res.render('editar-vacante',{
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre
    })
}

exports.editarVacante = async (req,res,next) => {
    const { url } = req.params
    const vacanteActualizada = req.body
    vacanteActualizada.skills = req.body.skills.split(',')

    const vacante = await Vacante.findOneAndUpdate({ url }, vacanteActualizada, {new: true, runValidators: true})

    res.redirect(`/vacantes/${vacante.url}`)
}

// validar y sanitizar los campos de las nuevas vacantes
exports.validarVacante = async(req,res,next) => {
    // sanitizar los campos
    await check('titulo').notEmpty().withMessage('El titulo es requerido').run(req)
    await check('empresa').notEmpty().withMessage('La empresa es requerida').run(req)
    await check('ubicacion').notEmpty().withMessage('La ubicacion es requerida').run(req)
    await check('contrato').notEmpty().withMessage('El tipo de contrato es requerida').run(req)
    await check('skills').notEmpty().withMessage('Las habilidades son requeridas').run(req)

    let results = validationResult(req)

    if(!results.isEmpty()){
        req.flash('error',results.array().map(error=>error.msg))
        return res.render('nueva-vacante',{
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
    }
    next()
}

exports.eliminarVacante = async(req,res,next) =>{
    const { id } = req.params

    const vacante = await Vacante.findById(id)

    if(verificarAutor(vacante, req.user)){
        vacante.remove()
        res.status(200).send('Vacante eliminada correctamente')
    }else{
        res.status(403).send('error')
    }
}

const verificarAutor = (vacante={}, usuario = {}) => {
    if(!vacante.autor.equals(usuario._id)){
        return false
    }else{
        return true
    }
}

exports.subirCV = (req,res,next) => {
    upload(req,res,function(error){

        if(error){
            if( error instanceof multer.MulterError){
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', 'El archivo es muy grande')
                    return;
                }else{
                    req.flash('error', error.message)
                }
            } else{
                req.flash('error', error.message)
            }
            res.redirect('back')
            return;
        }else{
            return next()
        }
    });
}

const configuracionMulter = {
    limits: { fileSize: 100000000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req,file,cb) => {
            cb(null, __dirname+'../../public/uploads/cv');
        },
        filename: (req,file,cb) => {
            const extension = file.mimetype.split('/')[1]
            cb(null, `${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype === 'application/pdf'){
            // el callbacj se ejecuta como true o false: true cuando la imagen se acepta
            cb(null,true)
        }else{
            cb(new Error('Formato no valido'),false)
        }
    }
}

const upload = multer(configuracionMulter).single('cv')

// almacenar los candidatos en la bd
exports.contactar = async(req,res,next) => {
    const { url } = req.params
    const vacante = await Vacante.findOne({url})

    if(!vacante){
        next()
    }

    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    vacante.candidatos.push(nuevoCandidato)
    await vacante.save()

    req.flash('correcto', 'Se envio tu Cv al reclutador')
    res.redirect('/')
}


exports.mostrarCandidatos = async(req,res,next) =>{
    const id = req.params.id

    const vacante = await Vacante.findById(id)

    if(vacante.autor.toString() !== req.user._id.toString()){
        return next()
    }

    if(!vacante){
        return next()
    }

    res.render('candidatos', {
        nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })
}

// buscador de vacantes
exports.buscadorVacantes = async(req,res) => {
    const { q } = req.body

    console.log(q)
    // return
    const vacantes = await Vacante.find({
        $text: {
            $search: q
        }
    }).lean()

    res.render('home',{
        nombrePagina: `Resultados de la busqueda ${q}`,
        barra: true,
        vacantes
    })
}