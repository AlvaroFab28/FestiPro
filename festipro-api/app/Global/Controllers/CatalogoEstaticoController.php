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
                        ->select('id', 'name as nombre', 'icon_url')
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
}
