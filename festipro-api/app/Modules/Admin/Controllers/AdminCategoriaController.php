<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Global\Models\Category;
use App\Global\Traits\ApiResponseTrait;


class AdminCategoriaController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        // Devolver todas las categorías (incluyendo las inactivas) para administración
        $categorias = Category::withCount('talentProfiles')
            ->orderBy('name', 'asc')
            ->get();

        return $this->successResponse($categorias, 'Categorías obtenidas correctamente.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'icon_class' => 'required|string|max:50',
        ]);

        $categoria = Category::create([
            'name' => $request->name,
            'icon_class' => $request->icon_class,
            'is_active' => true,
        ]);

        \App\Modules\Admin\Models\AdminLog::log(
            'create_category',
            'category',
            $categoria->id,
            "Se creó la categoría: {$categoria->name}"
        );

        return $this->successResponse($categoria, 'Categoría creada con éxito.', 201);
    }

    public function update(Request $request, $id)
    {
        $categoria = Category::find($id);

        if (!$categoria) {
            return $this->errorResponse('Categoría no encontrada.', 404);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'icon_class' => 'required|string|max:50',
        ]);

        $categoria->name = $request->name;
        $categoria->icon_class = $request->icon_class;
        $categoria->save();

        \App\Modules\Admin\Models\AdminLog::log(
            'update_category',
            'category',
            $categoria->id,
            "Se actualizó la categoría: {$categoria->name}"
        );

        return $this->successResponse($categoria, 'Categoría actualizada con éxito.');
    }

    public function toggle(Request $request, $id)
    {
        $categoria = Category::find($id);

        if (!$categoria) {
            return $this->errorResponse('Categoría no encontrada.', 404);
        }

        $categoria->is_active = !$categoria->is_active;
        $categoria->save();

        $estado = $categoria->is_active ? 'activó' : 'desactivó';
        \App\Modules\Admin\Models\AdminLog::log(
            'toggle_category',
            'category',
            $categoria->id,
            "Se {$estado} la categoría: {$categoria->name}"
        );

        return $this->successResponse($categoria, 'Estado de la categoría actualizado con éxito.');
    }

    public function destroy($id)
    {
        $categoria = Category::find($id);

        if (!$categoria) {
            return $this->errorResponse('Categoría no encontrada.', 404);
        }

        $nombreCategoria = $categoria->name;
        
        try {
            $categoria->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            // Error de integridad referencial (llave foránea)
            if ($e->getCode() == 23000) {
                return $this->errorResponse('No puedes eliminar esta categoría porque está siendo usada por talentos o eventos activos.', 409);
            }
            return $this->errorResponse('Error en la base de datos al intentar eliminar la categoría.', 500);
        } catch (\Exception $e) {
            return $this->errorResponse('Error interno al intentar eliminar la categoría.', 500);
        }

        \App\Modules\Admin\Models\AdminLog::log(
            'delete_category',
            'category',
            $id,
            "Se eliminó la categoría: {$nombreCategoria}"
        );

        return $this->successResponse(null, 'Categoría eliminada con éxito.');
    }
}
