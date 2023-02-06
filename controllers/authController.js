const passport = require('passport')
const Usuarios = require('../models/Usuarios')
const Vacantes = require('../models/Vacantes')
const crypto = require('crypto')
const { reset } = require('slug')
const enviarEmail = require('../handlers/email')

exports.autenticarUsuario =  passport.authenticate('local',{
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true
})

// revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req,res,next) => {
    if(req.isAuthenticated()){ //isAuthenticated es un metodo de passport
        return next() // esta autenticado
    }

    //redireccionar
    res.redirect('/iniciar-sesion')
}

exports.mostrarPanel = async(req,res) =>{
    //consultar el usuario autenticado

    const vacantes = await Vacantes.find({autor: req.user._id})

    // console.log(vacantes)

    res.render('administracion',{
        nombrePagina: 'Panel de adminstracion',
        tagline: 'Crea y administra tus vacantes desde aquí',
        vacantes,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        // candidatos: vacantes.candidatos.length
    })
}

exports.cerrarSesion = async(req,res) => {
    req.logout()
    req.flash('correcto','Cerraste sesion correctamente')
    return res.redirect('/iniciar-sesion')
}

exports.formReestablecerPassword = (req,res) =>{
    res.render('reestablecer-password',{
        nombrePagina:'Reestablece tu password',
        tagline: 'Si ya tienes unac uetna pero olvidaste tu password'
    })
}

exports.enviarToken = async(req,res) => {
    const usuario = await Usuarios.findOne({email: req.body.email})

    if(!usuario){
        res.flash('error','No existe esta cuenta')
        return res.redirect('/iniciar-sesion')
    }

    usuario.token = crypto.randomBytes(20).toString('hex')
    usuario.expira = Date.now() + 3600000

    await usuario.save()
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`

    console.log(resetUrl)
    // ToDo:Enviar notificacion por email
    await enviarEmail.enviar({
        usuario,
        subject: 'Password reset',
        resetUrl,
        archivo: 'reset'
    })


    req.flash('correcto','Revisa tu email')
    res.redirect('/iniciar-sesion')
}

// valida si el token es valido y el usuairio existe, muestra la vista
exports.reestablecePassword = async(req,res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    })

    if(!usuario){
        req.flash('error', 'El formulario ya no es valido')
        return res.redirect('/reestablecer-password')
    }

    res.render('nuevo-password',{
        nombrePagina: 'Modifica tu password',

    })
}

// almacena la nueva password en la bd
exports.guardarPassword = async(req,res,next) => {
    const usuario = Usuarios.findOne({
        token: req.params.token
    })

    if(!usuario){
        req.flash('error', 'El formulario ya no es valido')
        return res.redirect('/reestablecer-password')
    }

    usuario.password = req.body.password
    usuario.token = undefined
    usuario.expira = undefined

    await usuario.save()

    req.flash('correcto', 'Password modificado')
    res.redirecT('/iniciar-sesion')

}