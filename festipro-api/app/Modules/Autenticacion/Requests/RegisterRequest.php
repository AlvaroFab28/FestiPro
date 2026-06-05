<?php

namespace App\Modules\Autenticacion\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return true; // Todos pueden intentar registrarse
    }

    /**
     * Reglas de validación para el registro.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            // El email debe ser único en la tabla users
            'email' => 'required|string|email|max:255|unique:users,email', 
            'password' => 'required|string|min:8', 
            // Validamos que el rol sea exactamente uno de estos dos
            'role' => 'required|in:Anfitrión,Talento', 
            'whatsapp_number' => 'nullable|string|max:20'
        ];
    }
}