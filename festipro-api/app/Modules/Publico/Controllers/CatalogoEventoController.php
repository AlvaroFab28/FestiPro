<?php

namespace App\Modules\Publico\Controllers;

use App\Http\Controllers\Controller;
use App\Global\Traits\ApiResponseTrait;
use App\Modules\Anfitrion\Models\Event;
use Illuminate\Http\Request;

class CatalogoEventoController extends Controller
{
    use ApiResponseTrait;

    /**
     * Listar eventos con filtros dinámicos (Público).
     */
    public function index(Request $request)
    {
        $query = Event::with(['host', 'city', 'category'])
            ->whereNotIn('status', ['cerrado', 'cancelado']);

        // Filtro por categoría
        if ($request->filled('categoria')) {
            $query->where('category_id', $request->query('categoria'));
        }

        // Filtro por ciudad
        if ($request->filled('ciudad')) {
            $query->where('city_id', $request->query('ciudad'));
        }

        // Filtro por búsqueda de texto (título, descripción o nombre del anfitrión)
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhereHas('host', function ($h) use ($q) {
                        $h->where('name', 'like', "%{$q}%");
                    });
            });
        }

        // Paginación
        $eventos = $query->orderBy('created_at', 'desc')->paginate(12);

        return $this->successResponse($eventos, 'Catálogo de eventos obtenido correctamente.');
    }
}
