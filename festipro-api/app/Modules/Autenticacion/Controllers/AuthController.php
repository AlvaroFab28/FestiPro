<?php

namespace App\Modules\Autenticacion\Controllers;

use App\Http\Controllers\Controller; // Heredamos del controlador base nativo
use App\Modules\Autenticacion\Requests\RegisterRequest;
use App\Modules\Autenticacion\Requests\LoginRequest;
use App\Modules\Autenticacion\Services\AuthService;
use App\Global\Traits\ApiResponseTrait; // Inyectamos nuestro formato JSON
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponseTrait;

    protected AuthService $authService;

    /**
     * Inyectamos el servicio en el constructor.
     */
    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Endpoint para registrar un usuario.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        // El request ya viene validado gracias a RegisterRequest
        $result = $this->authService->register($request->validated());

        return $this->successResponse(
            $result, 
            'Usuario registrado exitosamente', 
            201 // Código HTTP 201: Creado
        );
    }

    /**
     * Endpoint para iniciar sesión.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return $this->successResponse(
            $result, 
            'Inicio de sesión exitoso'
        );
    }

    /**
     * Endpoint para cerrar sesión (destruye el token actual).
     */
    public function logout(Request $request): JsonResponse
    {
        // Borramos el token que se usó para esta petición 
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(
            null, 
            'Sesión cerrada correctamente'
        );
    }
}