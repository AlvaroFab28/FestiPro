<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Autenticacion\Controllers\AuthController;
use App\Global\Controllers\CatalogoEstaticoController;
use App\Modules\Talento\Controllers\PerfilTalentoController;
use App\Modules\Talento\Controllers\GaleriaTalentoController;
use App\Modules\Anfitrion\Controllers\EventoController;
use App\Modules\Anfitrion\Controllers\FavoritoController;
use App\Modules\Anfitrion\Controllers\AnfitrionCuentaController;
use App\Modules\Anfitrion\Controllers\ReviewController;
use App\Modules\Publico\Controllers\CatalogoTalentoController;
use App\Modules\Publico\Controllers\CatalogoEventoController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas (No requieren Token)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catálogos Estáticos (Maestros) para llenar selects dinámicos en el Frontend
Route::get('/categorias', [CatalogoEstaticoController::class, 'getCategorias']);
Route::get('/ciudades', [CatalogoEstaticoController::class, 'getCiudades']);
Route::get('/stats', [CatalogoEstaticoController::class, 'getStats']);
Route::get('/stats/map', [CatalogoEstaticoController::class, 'getMapStats']);

// Catálogos Públicos de Descubrimiento
Route::get('/talentos', [CatalogoTalentoController::class, 'index']);
Route::get('/talentos/top', [CatalogoTalentoController::class, 'topTendencia']);
Route::get('/talentos/{id}', [CatalogoTalentoController::class, 'show']);
Route::get('/eventos', [CatalogoEventoController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren Token de Sanctum)
|--------------------------------------------------------------------------
*/
// Usamos el middleware 'auth:sanctum' para exigir el token en el header
Route::middleware('auth:sanctum')->group(function () {
    
    // Ruta para cerrar sesión
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Ruta rápida para que el frontend pregunte "¿Quién soy?" y recargue sus datos
    Route::get('/me', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'status' => 'success',
            'data' => $request->user()
        ]);
    });

    // Módulo de Talento
    Route::get('/talento/perfil', [PerfilTalentoController::class, 'obtenerPerfil']);
    Route::post('/talento/perfil', [PerfilTalentoController::class, 'guardarPerfil']);
    Route::patch('/talento/disponibilidad', [PerfilTalentoController::class, 'alternarDisponibilidad']);
    Route::delete('/talento/galeria/{id}', [GaleriaTalentoController::class, 'eliminarFoto']);

    // Módulo de Anfitrión
    Route::prefix('anfitrion')->group(function () {
        Route::get('/eventos', [EventoController::class, 'index']);
        Route::post('/eventos', [EventoController::class, 'store']);
        Route::put('/eventos/{id}', [EventoController::class, 'update']);
        Route::delete('/eventos/{id}', [EventoController::class, 'destroy']);
        
        // Cuenta
        Route::post('/cuenta', [AnfitrionCuentaController::class, 'update']);
        
        // Favoritos
        Route::get('/favoritos', [FavoritoController::class, 'index']);
        Route::post('/favoritos/{talento_id}', [FavoritoController::class, 'store']);
        Route::delete('/favoritos/{talento_id}', [FavoritoController::class, 'destroy']);

        // Reseñas
        Route::post('/reviews', [ReviewController::class, 'store']);
    });

    // Módulo de Administración (Panel Interno y Moderación)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/usuarios', [\App\Modules\Admin\Controllers\AdminUsuarioController::class, 'index']);
        Route::patch('/usuarios/{id}/ban', [\App\Modules\Admin\Controllers\AdminUsuarioController::class, 'toggleBan']);
        Route::patch('/usuarios/{id}/rol', [\App\Modules\Admin\Controllers\AdminUsuarioController::class, 'toggleRole']);
        Route::get('/stats', [\App\Modules\Admin\Controllers\AdminUsuarioController::class, 'stats']);
        Route::get('/actividad/reciente', [\App\Modules\Admin\Controllers\AdminUsuarioController::class, 'recentActivity']);
        
        Route::get('/categorias', [\App\Modules\Admin\Controllers\AdminCategoriaController::class, 'index']);
        Route::post('/categorias', [\App\Modules\Admin\Controllers\AdminCategoriaController::class, 'store']);
        Route::post('/categorias/{id}', [\App\Modules\Admin\Controllers\AdminCategoriaController::class, 'update']);
        Route::patch('/categorias/{id}/toggle', [\App\Modules\Admin\Controllers\AdminCategoriaController::class, 'toggle']);
        Route::delete('/categorias/{id}', [\App\Modules\Admin\Controllers\AdminCategoriaController::class, 'destroy']);

        // Moderación de contenido
        Route::get('/contenido/talentos', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'indexTalentos']);
        Route::get('/contenido/talentos/{id}', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'showTalento']);
        Route::delete('/contenido/talentos/{id}', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'destroyTalento']);
        Route::delete('/contenido/talentos/{id}/fotos/{fotoId}', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'destroyTalentoFoto']);
        Route::patch('/contenido/talentos/{id}/descripcion', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'clearTalentoDescripcion']);
        Route::patch('/contenido/talentos/{id}/avatar', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'clearTalentoAvatar']);
        Route::patch('/contenido/talentos/{id}/banner', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'clearTalentosBanner']);

        Route::get('/contenido/eventos', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'indexEventos']);
        Route::get('/contenido/eventos/{id}', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'showEvento']);
        Route::patch('/contenido/eventos/{id}/cerrar', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'closeEvento']);
        Route::delete('/contenido/eventos/{id}', [\App\Modules\Admin\Controllers\AdminContenidoController::class, 'destroyEvento']);

        // Logs de Administrador
        Route::get('/logs', [\App\Modules\Admin\Controllers\AdminUsuarioController::class, 'indexLogs']);
    });

});