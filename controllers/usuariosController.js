const Usuarios = require("../models/Usuarios")
const { check, validationResult } = require('express-validator')
const multer = require("multer")
const shortid = require('shortid')

exports.formCrearCuenta = (req,res) => {
    res.render('crear-cuenta',{
        nombrePagina: 'Crea tu cuenta en devJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}

exports.validarRegistro = async (req,res,next) => {
    await check('email').isEmail().withMessage('El correo no es valido').run(req)
    await check('nombre').notEmpty().withMessage('El nombre es requerido').run(req)
    await check('password').isLength({min: 6}).withMessage('El password debe ser de 6 caracteres minimo').run(req)
    await check('repetir-password').equals(req.body.password).withMessage('Las contraseñas no son iguales').run(req)

    let results = validationResult(req)

    if(!results.isEmpty()){
        req.flash('error', results.array().map(error =>error.msg))
        return res.render('crear-cuenta',{
            nombrePagina: 'Crea tu cuenta en devJobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash(),
            errores: results.array()
        })
    }

    next()
}

exports.crearUsuario = async(req,res,next) => {
    
    const usuario = new Usuarios(req.body)
    
    try{
        await usuario.save()
        res.redirect('/iniciar-sesion')
    }catch(error){
        req.flash('error', 'La cuenta ya esta registrada')
        res.redirect('/crear-cuenta')
    }

}

exports.formIniciarSesion = (req,res) => {
    res.render('iniciar-sesion',{
        nombrePagina: 'Iniciar Sesión devJobs',
    })
}

// form editar el perfil

exports.formEditarPerfil = (req,res) => {
    res.render('editar-perfil',{
        nombrePagina: 'Editar tu perfil en devJobs',
        usuario: req.user,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

// guardar cambios editados del perfil
exports.editarPerfil = async(req,res) => {

    const usuario = await Usuarios.findById(req.user._id)

    usuario.nombre = req.body.nombre
    usuario.email = req.body.email

    if(req.body.password){
        usuario.password = req.body.password
    }
    // console.log(req.file)
    // return
    if(req.file){
        usuario.imagen = req.file.filename
    }

    await usuario.save()

    req.flash('correcto','Cambios guardados correctamente')
    res.redirect('/administracion')
}

// sanitizar y validar el formulario de editar perfiles
exports.validarPerfilEditar = async(req,res,next) => {
    await check('email').isEmail().withMessage('El correo no es valido').run(req)
    await check('nombre').notEmpty().withMessage('El nombre es requerido').run(req)

    if(req.body.password){
        await check('password').isLength({min: 6}).withMessage('El password debe ser de 6 caracteres minimo').run(req)
    }

    let results = validationResult(req)

    if(!results.isEmpty()){
        req.flash('error', results.array().map(error =>error.msg))
        return res.render('editar-perfil',{
            nombrePagina: 'Editar tu perfil en devJobs',
            usuario: req.user,
            cerrarSesion: true,
            nombre: req.user.nombre,
            // mensajes: req.flash('error', results.array().map(result => result.msg))
            mensajes: req.flash(),
        })
    }

    next()
}

exports.subirImagen = async(req,res,next) => {
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
            res.redirect('/administracion')
            return;
        }else{
            return next()
        }
    });

}

//opciones de multer
const configMulter = {
    limits: { fileSize: 10000000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req,file,cb) => {
            cb(null, __dirname+'../../public/uploads/perfiles');
        },
        filename: (req,file,cb) => {
            const extension = file.mimetype.split('/')[1]
            // console.log(`${shortid.generate()}.${extension}`)
            // return
            cb(null, `${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/svg' || file.mimetype === 'image/png'){
            // el callbacj se ejecuta como true o false: true cuando la imagen se acepta
            cb(null,true)
        }else{
            cb(new Error('Formato no valido'),false)
        }
    }
}

const upload = multer(configMulter).single('imagen')
