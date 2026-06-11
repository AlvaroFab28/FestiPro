<?php

namespace App\Modules\Anfitrion\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Global\Traits\ApiResponseTrait;
use App\Global\Services\ImageOptimizationService;

class AnfitrionCuentaController extends Controller
{
    use ApiResponseTrait;

    public function update(Request $request, ImageOptimizationService $imageService)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'whatsapp_number' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->whatsapp_number = $request->whatsapp_number;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->hasFile('avatar')) {
            // Eliminar avatar anterior si existe
            if ($user->avatar_url) {
                // Remover el prefijo '/storage/' para que storage:delete apunte correctamente
                $oldPath = str_replace('/storage/', '', $user->avatar_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $path = $imageService->optimizeAvatar($request->file('avatar'), 'anfitriones/avatars');
            $user->avatar_url = '/storage/' . $path;
        }

        $user->save();

        return $this->successResponse($user, 'Cuenta actualizada con éxito.');
    }
}
