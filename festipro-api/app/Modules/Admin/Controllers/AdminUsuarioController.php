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
        $usuarios = User::with('talentProfile:id,user_id,artistic_name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) use ($superAdminEmail) {
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

        $isSuspending = !$user->isBanned();

        if ($user->isBanned()) {
            $user->banned_at = null;
            $user->banned_until = null;
        } else {
            $user->banned_at = now();
            $durationDays = $request->input('duration_days');
            if ($durationDays && is_numeric($durationDays) && $durationDays > 0) {
                $user->banned_until = now()->addDays(intval($durationDays));
            } else {
                $user->banned_until = null; // Indefinido
            }
        }

        $user->save();

        // Log admin action
        $action = $isSuspending ? 'suspend_user' : 'unsuspend_user';
        $durationText = $user->banned_until ? " hasta " . $user->banned_until->toDateTimeString() : " indefinidamente";
        $details = $isSuspending 
            ? "Se suspendió al usuario {$user->name} ({$user->email}){$durationText}." 
            : "Se levantó la suspensión al usuario {$user->name} ({$user->email}).";

        \App\Modules\Admin\Models\AdminLog::log($action, 'user', $user->id, $details);

        $statusMessage = $user->isBanned() ? 'Usuario suspendido con éxito.' : 'Suspensión del usuario levantada con éxito.';
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

        // Log admin action
        $action = $user->is_admin ? 'assign_admin_role' : 'revoke_admin_role';
        $details = $user->is_admin 
            ? "Se asignó rol de administrador a {$user->name} ({$user->email})."
            : "Se revocó rol de administrador a {$user->name} ({$user->email}).";

        \App\Modules\Admin\Models\AdminLog::log($action, 'user', $user->id, $details);

        $statusMessage = $user->is_admin ? 'Rol de administrador asignado con éxito.' : 'Rol de administrador revocado con éxito.';
        return $this->successResponse($user, $statusMessage);
    }

    public function stats(Request $request)
    {
        $totalUsuarios = User::count();
        
        $usuariosSuspendidos = User::whereNotNull('banned_at')
            ->where(function ($query) {
                $query->whereNull('banned_until')
                      ->orWhere('banned_until', '>', now());
            })->count();

        $talentosPublicados = \App\Modules\Talento\Models\TalentProfile::count();
        $eventosAbiertos = \App\Modules\Anfitrion\Models\Event::where('status', 'abierto')->count();
        $reviewsTotales = \App\Modules\Anfitrion\Models\Review::count();
        $categoriasActivas = \App\Global\Models\Category::where('is_active', true)->count();
        $totalVisitas = \App\Modules\Talento\Models\TalentProfile::sum('profile_views') ?: 0;

        $talentosCount = User::where('role', 'talento')->count();
        $anfitrionesCount = User::where('role', 'anfitrion')->count();
        $adminsCount = User::where('is_admin', true)->count();

        return $this->successResponse([
            'total_usuarios' => $totalUsuarios,
            'usuarios_suspendidos' => $usuariosSuspendidos,
            'talentos_publicados' => $talentosPublicados,
            'eventos_abiertos' => $eventosAbiertos,
            'reviews_totales' => $reviewsTotales,
            'categorias_activas' => $categoriasActivas,
            'total_visitas' => $totalVisitas,
            'distribution' => [
                'talentos' => $talentosCount,
                'anfitriones' => $anfitrionesCount,
                'administradores' => $adminsCount
            ]
        ], 'Estadísticas globales obtenidas correctamente.');
    }

    public function recentActivity(Request $request)
    {
        $limit = $request->query('limit', 20);

        $usuarios = User::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get(['id', 'name', 'email', 'role', 'is_admin', 'created_at']);

        $eventos = \App\Modules\Anfitrion\Models\Event::with(['host:id,name', 'category:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $reviews = \App\Modules\Anfitrion\Models\Review::with(['host:id,name', 'talentProfile:id,artistic_name'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->successResponse([
            'usuarios' => $usuarios,
            'eventos' => $eventos,
            'reviews' => $reviews
        ], 'Actividad reciente obtenida con éxito.');
    }

    public function indexLogs(Request $request)
    {
        $logs = \App\Modules\Admin\Models\AdminLog::with('admin:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return $this->successResponse($logs, 'Logs de administración obtenidos correctamente.');
    }
}

