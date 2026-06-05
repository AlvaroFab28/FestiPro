<?php

namespace App\Global\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Trait para estandarizar todas las respuestas JSON de la API de FestiPro.
 */
trait ApiResponseTrait
{
    /**
     * Devuelve una respuesta JSON exitosa.
     * * @param mixed $data Datos a devolver (ej. un usuario, una lista de talentos).
     * @param string|null $message Mensaje opcional de éxito.
     * @param int $code Código HTTP (por defecto 200 OK).
     */
    protected function successResponse($data = null, string $message = null, int $code = 200): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Devuelve una respuesta JSON de error.
     * * @param string $message Detalle del error para el frontend.
     * @param int $code Código HTTP (por defecto 400 Bad Request).
     */
    protected function errorResponse(string $message, int $code = 400): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message
        ], $code);
    }
}