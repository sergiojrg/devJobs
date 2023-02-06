const express = require('express')
const router = express.Router()
const homeController = require('../controllers/homeController')
const vacanteController = require('../controllers/vacanteController')
const usuariosController = require('../controllers/usuariosController')
const authController = require('../controllers/authController')

module.exports = () => {
    router.get('/', homeController.mostrarTrabajos)

    //crear vacantes
    router.get('/vacantes/nueva', authController.verificarUsuario, vacanteController.formularioNuevaVacante)
    router.post('/vacantes/nueva', authController.verificarUsuario, vacanteController.validarVacante, vacanteController.agregarVacante)

    // mostrar una vacante (singular)
    router.get('/vacantes/:url', vacanteController.mostrarVacante)

    // Editar vacante
    router.get('/vacantes/editar/:url', authController.verificarUsuario, vacanteController.formEditarVacante)
    router.post('/vacantes/editar/:url', authController.verificarUsuario, vacanteController.validarVacante, vacanteController.editarVacante)

    //eliminar vacante
    router.delete('/vacantes/eliminar/:id',
        vacanteController.eliminarVacante
    )

    // crear cuentas
    router.get('/crear-cuenta', usuariosController.formCrearCuenta)
    router.post('/crear-cuenta', 
        usuariosController.validarRegistro,
        usuariosController.crearUsuario
    )

    //Autenticar usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion)
    router.post('/iniciar-sesion', authController.autenticarUsuario)

    //panel de administacion
    router.get('/administracion', authController.verificarUsuario, authController.mostrarPanel)

    // editar perfil
    router.get('/editar-perfil', authController.verificarUsuario, usuariosController.formEditarPerfil)
    router.post('/editar-perfil', 
        authController.verificarUsuario, 
        // usuariosController.validarPerfilEditar, 
        usuariosController.subirImagen,
        usuariosController.editarPerfil
    )

    // Cerrar sesion
    router.get('/cerrar-sesion', authController.verificarUsuario, authController.cerrarSesion)

    //recibirmensajes de candidatos
    router.post('/vacantes/:url',
        vacanteController.subirCV,
        vacanteController.contactar
    )

    router.get('/candidatos/:id',
        authController.verificarUsuario,
        vacanteController.mostrarCandidatos
    )

    // Resetear email
    router.get('/reestablecer-password', authController.formReestablecerPassword)
    router.post('/reestablecer-password', authController.enviarToken)

    // resetear password almacenar en la bd
    router.get('/reestablecer-password/:token', authController.reestablecePassword)
    router.post('/reestablecer-password/:token', authController.guardarPassword)

    // buscador de vacantes
    router.post('/buscador', vacanteController.buscadorVacantes)
    return router
}