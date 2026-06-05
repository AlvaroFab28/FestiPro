<?php

namespace App\Modules\Anfitrion\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\Anfitrion\Models\Favorite;
use App\Modules\Talento\Models\TalentProfile;
use App\Global\Traits\ApiResponseTrait;

class FavoritoController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        // Traer favoritos del usuario autenticado y cargar la información del perfil del talento
        // y del usuario vinculado al talento (para obtener nombre y foto).
        $favoritos = Favorite::with(['talentProfile.user', 'talentProfile.category', 'talentProfile.city'])
            ->where('host_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return $this->successResponse($favoritos, 'Favoritos obtenidos correctamente.');
    }

    public function store(Request $request, $talento_id)
    {
        // Validar si el perfil existe
        $perfil = TalentProfile::find($talento_id);
        if (!$perfil) {
            return $this->errorResponse('El perfil de talento no existe.', 404);
        }

        // Crear o ignorar si ya existe
        $favorito = Favorite::firstOrCreate([
            'host_id' => $request->user()->id,
            'talent_profile_id' => $talento_id
        ]);
        
        return $this->successResponse($favorito, 'Talento guardado en favoritos.', 201);
    }

    public function destroy(Request $request, $talento_id)
    {
        $favorito = Favorite::where('host_id', $request->user()->id)
            ->where('talent_profile_id', $talento_id)
            ->first();
            
        if (!$favorito) {
            return $this->errorResponse('El talento no se encuentra en tus favoritos.', 404);
        }
        
        $favorito->delete();
        
        return $this->successResponse(null, 'Talento removido de favoritos.');
    }
}
