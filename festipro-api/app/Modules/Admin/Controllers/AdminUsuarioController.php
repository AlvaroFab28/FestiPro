<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\Autenticacion\Models\User;
use App\Global\Traits\ApiResponseTrait;

class AdminUsuarioController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        // Obtener todos los usuarios de la base de datos para administración
        $superAdminEmail = env('SUPER_ADMIN_EMAIL');
        $usuarios = User::orderBy('created_at', 'desc')->get()->map(function ($user) use ($superAdminEmail) {
            $user->setAttribute('is_super_admin', $superAdminEmail && ($user->email === $superAdminEmail));
            return $user;
        });

        return $this->successResponse($usuarios, 'Usuarios obtenidos correctamente.');
    }

    public function toggleBan(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado.', 404);
        }

        // Evitar auto-ban
        if ($user->id === $request->user()->id) {
            return $this->errorResponse('No puedes suspenderte a ti mismo.', 403);
        }

        // Evitar banear al Súper Administrador
        $superAdminEmail = env('SUPER_ADMIN_EMAIL');
        if ($superAdminEmail && $user->email === $superAdminEmail) {
            return $this->errorResponse('No se puede suspender al Súper Administrador.', 403);
        }

        if ($user->banned_at === null) {
            $user->banned_at = now();
        } else {
            $user->banned_at = null;
        }

        $user->save();

        $statusMessage = $user->banned_at ? 'Usuario suspendido con éxito.' : 'Suspensión del usuario levantada con éxito.';
        return $this->successResponse($user, $statusMessage);
    }

    public function toggleRole(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado.', 404);
        }

        // Evitar auto-despojo de rol
        if ($user->id === $request->user()->id) {
            return $this->errorResponse('No puedes revocar tu propio rol de administrador.', 403);
        }

        // Evitar despojar de rol de administrador al Súper Administrador
        $superAdminEmail = env('SUPER_ADMIN_EMAIL');
        if ($superAdminEmail && $user->email === $superAdminEmail && $user->is_admin) {
            return $this->errorResponse('No se puede revocar el rol de administrador al Súper Administrador.', 403);
        }

        $user->is_admin = !$user->is_admin;
        $user->save();

        $statusMessage = $user->is_admin ? 'Rol de administrador asignado con éxito.' : 'Rol de administrador revocado con éxito.';
        return $this->successResponse($user, $statusMessage);
    }
}

