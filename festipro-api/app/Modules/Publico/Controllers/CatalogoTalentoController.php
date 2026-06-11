<?php

namespace App\Modules\Publico\Controllers;

use App\Http\Controllers\Controller;
use App\Global\Traits\ApiResponseTrait;
use App\Modules\Talento\Models\TalentProfile;
use Illuminate\Http\Request;

class CatalogoTalentoController extends Controller
{
    use ApiResponseTrait;
    /**
     * Listar talentos con filtros dinámicos (Público).
     */
    public function index(Request $request)
    {
        $query = TalentProfile::with(['user', 'city', 'category']);

        // Filtro por disponibilidad
        if ($request->query('solo_disponibles') === 'true' || $request->query('solo_disponibles') === '1') {
            $query->where('is_available', true);
        }

        // Filtro por categoría
        if ($request->filled('categoria')) {
            $query->where('category_id', $request->query('categoria'));
        }

        // Filtro por ciudad
        if ($request->filled('ciudad')) {
            $query->where('city_id', $request->query('ciudad'));
        }

        // Filtro por precio mínimo
        if ($request->filled('precio_min')) {
            $query->where('base_price', '>=', $request->query('precio_min'));
        }

        // Filtro por precio máximo
        if ($request->filled('precio_max')) {
            $query->where('base_price', '<=', $request->query('precio_max'));
        }

        // Filtro por rating mínimo
        if ($request->filled('rating_min')) {
            $query->where('average_rating', '>=', $request->query('rating_min'));
        }

        // Filtro por búsqueda de texto (nombre artístico, bio o nombre del usuario)
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('artistic_name', 'like', "%{$q}%")
                    ->orWhere('bio', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($u) use ($q) {
                        $u->where('name', 'like', "%{$q}%");
                    });
            });
        }

        // Paginación
        $talentos = $query->orderBy('created_at', 'desc')->paginate(12);

        return $this->successResponse($talentos, 'Catálogo de talentos obtenido correctamente.');
    }

    /**
     * Obtener el perfil público individual de un talento.
     */
    public function show($id)
    {
        $profile = TalentProfile::with(['user', 'galleries', 'city', 'category', 'reviews.host'])
            ->where('id', $id)
            ->orWhere('user_id', $id)
            ->first();

        if (!$profile) {
            return $this->errorResponse('El perfil artístico solicitado no existe.', 404);
        }

        // Incrementar contador de vistas de perfil
        $profile->increment('profile_views');

        return $this->successResponse($profile, 'Perfil de talento obtenido correctamente.');
    }

    /**
     * Obtener el top 3 de talentos en tendencia.
     */
    public function topTendencia()
    {
        $top = TalentProfile::with(['user', 'city', 'category'])
            ->where('is_available', true)
            ->orderBy('average_rating', 'desc')
            ->orderBy('profile_views', 'desc')
            ->limit(3)
            ->get();

        return $this->successResponse($top, 'Top talentos en tendencia.');
    }
}
