<?php

namespace App\Global\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use App\Global\Traits\ApiResponseTrait;

class CatalogoEstaticoController extends Controller
{
    use ApiResponseTrait;

    public function getCategorias()
    {
        $categorias = DB::table('categories')
                        ->where('is_active', true)
                        ->select('id', 'name as nombre', 'icon_class')
                        ->get();
        
        return $this->successResponse($categorias, 'Categorías obtenidas correctamente.');
    }

    public function getCiudades()
    {
        $ciudades = DB::table('cities')
                        ->join('departments', 'cities.department_id', '=', 'departments.id')
                        ->where('cities.is_active', true)
                        ->select('cities.id', 'cities.name as ciudad', 'departments.name as departamento')
                        ->orderBy('departments.name')
                        ->orderBy('cities.name')
                        ->get();
                        
        return $this->successResponse($ciudades, 'Ciudades obtenidas correctamente.');
    }

    public function getStats()
    {
        $totalArtistas = DB::table('talent_profiles')
            ->join('users', 'talent_profiles.user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->where(function($query) {
                $query->whereNull('users.banned_at')
                      ->orWhere(function($q) {
                          $q->whereNotNull('users.banned_until')
                            ->where('users.banned_until', '<=', now());
                      });
            })
            ->count();

        $totalEventos = DB::table('events')
            ->where('status', 'abierto')
            ->count();

        $ratingPromedio = DB::table('talent_profiles')
            ->join('users', 'talent_profiles.user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->where(function($query) {
                $query->whereNull('users.banned_at')
                      ->orWhere(function($q) {
                          $q->whereNotNull('users.banned_until')
                            ->where('users.banned_until', '<=', now());
                      });
            })
            ->avg('average_rating');

        $ratingPromedio = round($ratingPromedio ?? 4.8, 1);
        if ($ratingPromedio == 0) {
            $ratingPromedio = 4.8; // Valor de fallback si no hay artistas
        }

        return $this->successResponse([
            'artistas' => $totalArtistas,
            'eventos' => $totalEventos,
            'rating' => $ratingPromedio
        ], 'Estadísticas obtenidas correctamente.');
    }

    public function getMapStats()
    {
        $DB_DEPT_TO_ISO = [
            1 => 'BO-H', // Chuquisaca
            2 => 'BO-L', // La Paz
            3 => 'BO-C', // Cochabamba
            4 => 'BO-O', // Oruro
            5 => 'BO-P', // Potosí
            6 => 'BO-T', // Tarija
            7 => 'BO-S', // Santa Cruz
            8 => 'BO-B', // Beni
            9 => 'BO-N'  // Pando
        ];

        $talentCounts = DB::table('talent_profiles')
            ->join('users', 'talent_profiles.user_id', '=', 'users.id')
            ->join('cities', 'talent_profiles.city_id', '=', 'cities.id')
            ->whereNull('users.deleted_at')
            ->where(function($query) {
                $query->whereNull('users.banned_at')
                      ->orWhere(function($q) {
                          $q->whereNotNull('users.banned_until')
                            ->where('users.banned_until', '<=', now());
                      });
            })
            ->select('cities.department_id', DB::raw('count(*) as count'))
            ->groupBy('cities.department_id')
            ->pluck('count', 'department_id')
            ->toArray();

        $eventCounts = DB::table('events')
            ->join('cities', 'events.city_id', '=', 'cities.id')
            ->select('cities.department_id', DB::raw('count(*) as count'))
            ->groupBy('cities.department_id')
            ->pluck('count', 'department_id')
            ->toArray();

        $stats = [];
        foreach ($DB_DEPT_TO_ISO as $id => $iso) {
            $stats[$iso] = [
                'talents' => $talentCounts[$id] ?? 0,
                'events' => $eventCounts[$id] ?? 0
            ];
        }

        return $this->successResponse($stats, 'Estadísticas del mapa obtenidas correctamente.');
    }
}

