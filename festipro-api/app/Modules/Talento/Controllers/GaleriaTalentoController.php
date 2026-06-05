<?php

namespace App\Modules\Talento\Controllers;

use App\Http\Controllers\Controller;
use App\Global\Traits\ApiResponseTrait;
use App\Modules\Talento\Models\TalentGallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GaleriaTalentoController extends Controller
{
    use ApiResponseTrait;

    /**
     * Tarea 3.2: Eliminar una foto específica de la galería del talento.
     */
    public function eliminarFoto(Request $request, $id)
    {
        // Aseguramos que el usuario tiene un perfil
        $profile = $request->user()->talentProfile;
        
        if (!$profile) {
            return $this->errorResponse('No tienes un perfil de talento configurado.', 404);
        }

        // Buscamos la foto asegurándonos de que pertenezca al perfil actual
        $foto = TalentGallery::where('id', $id)
                             ->where('perfil_id', $profile->id)
                             ->first();
                             
        if (!$foto) {
            return $this->errorResponse('Foto no encontrada o no tienes permisos para eliminarla.', 404);
        }

        // Borrado físico del disco
        $path = str_replace('/storage/', '', $foto->imagen_url);
        Storage::disk('public')->delete($path);
        
        // Borrado de la base de datos
        $foto->delete();

        return $this->successResponse(null, 'Foto eliminada del portafolio exitosamente.');
    }
}
