<?php

namespace App\Modules\Talento\Controllers;

use App\Http\Controllers\Controller;
use App\Global\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use App\Modules\Talento\Requests\GuardarTalentoRequest;
use App\Modules\Talento\Services\TalentoService;

class PerfilTalentoController extends Controller
{
    use ApiResponseTrait;

    /**
     * Tarea 3.1: Obtención de Perfil Completo (GET)
     * Devuelve los datos de users, perfiles_talento y galeria_talento combinados.
     */
    public function obtenerPerfil(Request $request)
    {
        // 1. Obtenemos al usuario autenticado por Sanctum
        $user = $request->user();

        // 2. Cargamos sus relaciones (Si existen) usando Eager Loading
        // Esto evitará el problema N+1 queries al traer todas las fotos de la galería de una sola vez
        $user->load(['talentProfile.galleries']);

        // 3. Estructuramos la respuesta consolidada
        $data = [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'nombre_completo' => $user->name,
                'telefono_whatsapp' => $user->whatsapp_number,
                'avatar_url' => $user->avatar_url,
                'rol' => $user->role,
            ],
            'talent_profile' => $user->talentProfile ? [
                'id' => $user->talentProfile->id,
                'categoria_id' => $user->talentProfile->category_id,
                'ciudad_id' => $user->talentProfile->city_id,
                'nombre_artistico' => $user->talentProfile->artistic_name,
                'biografia' => $user->talentProfile->bio,
                'precio_base' => $user->talentProfile->base_price,
                'youtube_link' => $user->talentProfile->youtube_link,
                'banner_url' => $user->talentProfile->banner_url,
                'esta_disponible' => $user->talentProfile->is_available,
                'vistas_perfil' => $user->talentProfile->profile_views,
                'calificacion_promedio' => (float)$user->talentProfile->average_rating,
                'comentarios_count' => $user->talentProfile->reviews()->count(),
                'galleries' => $user->talentProfile->galleries->map(function ($g) {
                    return [
                        'id' => $g->id,
                        'imagen_url' => $g->image_url
                    ];
                })
            ] : null,
        ];

        return $this->successResponse($data, 'Perfil recuperado con éxito.');
    }

    /**
     * Tarea 3.2: Guardar o Actualizar Perfil (Upsert POST)
     * Procesa un FormData masivo con textos, validaciones y subida de múltiples archivos.
     */
    public function guardarPerfil(GuardarTalentoRequest $request, TalentoService $service)
    {
        // Extraemos datos limpios y validados del request
        $data = $request->validated();
        $files = $request->allFiles();
        
        // Delegamos la complejidad transaccional (DB::transaction) al Servicio
        $userActualizado = $service->upsertPerfil($request->user(), $data, $files);

        // Retornamos el MISMO formato que obtenerPerfil() para que el Frontend solo tenga que "reemplazar" su estado
        $responseData = [
            'user' => [
                'id' => $userActualizado->id,
                'email' => $userActualizado->email,
                'nombre_completo' => $userActualizado->name,
                'telefono_whatsapp' => $userActualizado->whatsapp_number,
                'avatar_url' => $userActualizado->avatar_url,
                'rol' => $userActualizado->role,
            ],
            'talent_profile' => $userActualizado->talentProfile ? [
                'id' => $userActualizado->talentProfile->id,
                'categoria_id' => $userActualizado->talentProfile->category_id,
                'ciudad_id' => $userActualizado->talentProfile->city_id,
                'nombre_artistico' => $userActualizado->talentProfile->artistic_name,
                'biografia' => $userActualizado->talentProfile->bio,
                'precio_base' => $userActualizado->talentProfile->base_price,
                'youtube_link' => $userActualizado->talentProfile->youtube_link,
                'banner_url' => $userActualizado->talentProfile->banner_url,
                'esta_disponible' => $userActualizado->talentProfile->is_available,
                'vistas_perfil' => $userActualizado->talentProfile->profile_views,
                'calificacion_promedio' => (float)$userActualizado->talentProfile->average_rating,
                'comentarios_count' => $userActualizado->talentProfile->reviews()->count(),
                'galleries' => $userActualizado->talentProfile->galleries->map(function ($g) {
                    return [
                        'id' => $g->id,
                        'imagen_url' => $g->image_url
                    ];
                })
            ] : null,
        ];

        return $this->successResponse($responseData, 'Perfil y portafolio guardados exitosamente.', 201);
    }

    /**
     * Tarea 3.2: Alternar la disponibilidad del talento de forma rápida (PATCH)
     */
    public function alternarDisponibilidad(Request $request)
    {
        $request->validate([
            'esta_disponible' => 'required|boolean'
        ]);
        
        $profile = $request->user()->talentProfile;
        
        if (!$profile) {
            return $this->errorResponse('Aún no has configurado tu perfil artístico.', 404);
        }
        
        $profile->is_available = $request->esta_disponible;
        $profile->save();
        
        return $this->successResponse(
            ['esta_disponible' => $profile->is_available], 
            'Tu estado de disponibilidad ha sido actualizado.'
        );
    }
}

