<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Global\Models\Category;
use App\Global\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Storage;

class AdminCategoriaController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        // Devolver todas las categorías (incluyendo las inactivas) para administración
        $categorias = Category::orderBy('name', 'asc')->get();

        return $this->successResponse($categorias, 'Categorías obtenidas correctamente.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'icon' => 'required|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        $path = $request->file('icon')->store('categories', 'public');

        $categoria = Category::create([
            'name' => $request->name,
            'icon_url' => '/storage/' . $path,
            'is_active' => true,
        ]);

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
            'icon' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        $categoria->name = $request->name;

        if ($request->hasFile('icon')) {
            // Eliminar icono anterior si existe
            if ($categoria->icon_url) {
                $oldPath = str_replace('/storage/', '', $categoria->icon_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $path = $request->file('icon')->store('categories', 'public');
            $categoria->icon_url = '/storage/' . $path;
        }

        $categoria->save();

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

        return $this->successResponse($categoria, 'Estado de la categoría actualizado con éxito.');
    }
}
