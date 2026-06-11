<?php

namespace App\Modules\Autenticacion\Services;

use App\Modules\Autenticacion\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Lógica para registrar un nuevo usuario y devolver su token de acceso.
     */
    public function register(array $data): array
    {
        // 1. Creamos el usuario. Laravel encriptará el password automáticamente 
        // gracias al 'hashed' que configuramos en los casts del Modelo User.
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], 
            'role' => $data['role'],
            'whatsapp_number' => $data['whatsapp_number'] ?? null,
            'is_admin' => false, // Por seguridad, nadie se registra como admin 
        ]);

        // 2. Generamos el token de Sanctum 
        $token = $user->createToken('auth_token')->plainTextToken;

        // 3. Devolvemos el usuario y su llave
        return [
            'user' => $user,
            'token' => $token
        ];
    }

    /**
     * Lógica para validar credenciales y emitir un token.
     */
    public function login(array $credentials): array
    {
        // 1. Buscamos al usuario por su email
        $user = User::where('email', $credentials['email'])->first();

        // 2. Verificamos que exista y que la contraseña coincida
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            // Si falla, lanzamos una excepción de validación que Laravel maneja automáticamente
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // 2.5. Verificar si el usuario está suspendido
        if ($user->isBanned()) {
            $bannedUntilMsg = $user->banned_until ? ' hasta el ' . $user->banned_until->format('d/m/Y H:i') . '.' : '.';
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta ha sido suspendida' . $bannedUntilMsg],
            ]);
        }

        // 3. Generamos el token
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }
}