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
        $query = Event::with(['host', 'city', 'category']);

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

        // Filtro por rango de presupuesto (mínimo)
        if ($request->filled('min_budget')) {
            $query->where('estimated_budget', '>=', $request->query('min_budget'));
        }

        // Filtro por rango de presupuesto (máximo)
        if ($request->filled('max_budget')) {
            $query->where('estimated_budget', '<=', $request->query('max_budget'));
        }

        // Filtro por estado específico
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        // Filtro por solo eventos futuros
        if ($request->query('solo_futuros') === 'true' || $request->query('solo_futuros') === '1') {
            $query->where('event_date', '>=', now()->toDateString());
        }

        // Ordenamiento dinámico
        $orderBy = $request->query('order_by', 'created_at');
        $order = $request->query('order', 'desc');

        // Normalizar y validar columnas permitidas
        if (!in_array($orderBy, ['created_at', 'estimated_budget', 'event_date'])) {
            $orderBy = 'created_at';
        }
        if (!in_array(strtolower($order), ['asc', 'desc'])) {
            $order = 'desc';
        }

        $query->orderBy($orderBy, $order);

        // Paginación dinámica (soporta 'limit' o 'per_page')
        $perPage = $request->query('limit', $request->query('per_page', 12));
        if (!is_numeric($perPage) || $perPage <= 0) {
            $perPage = 12;
        }

        $eventos = $query->paginate((int)$perPage);

        return $this->successResponse($eventos, 'Catálogo de eventos obtenido correctamente.');
    }
}
