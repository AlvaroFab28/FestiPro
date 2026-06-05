<?php

namespace App\Modules\Talento\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GuardarTalentoRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado a realizar esta solicitud.
     */
    public function authorize()
    {
        // Sanctum ya verifica el token a nivel de ruta, retornamos true.
        return true;
    }

    /**
     * Reglas de validación para el Formulario de Portafolio.
     */
    public function rules()
    {
        return [
            // --- Datos de la tabla 'users' ---
            'nombre_completo' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $this->user()->id,
            'telefono_whatsapp' => 'nullable|string|max:50',
            // La contraseña es opcional al actualizar. Si se envía, min 8 chars.
            'password' => 'nullable|string|min:8',
            
            // --- Datos de la tabla 'perfiles_talento' ---
            // Ahora el perfil artístico es opcional. Solo se valida estrictamente si deciden crear su perfil (enviando el nombre)
            'nombre_artistico' => 'nullable|string|max:255',
            'categoria_id' => 'required_with:nombre_artistico|integer', 
            'ciudad_id' => 'required_with:nombre_artistico|integer',    
            'biografia' => 'nullable|string',
            'precio_base' => 'required_with:nombre_artistico|numeric|min:0',
            'youtube_link' => 'nullable|url|max:255',
            
            // --- Archivos (Multimedia) ---
            // Validamos que si envían imágenes, sean de formato correcto y máx 2MB (Avatar) o 4MB (Banner)
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            
            // --- Galería (Array de imágenes múltiples) ---
            // Se restringe a un máximo de 8 fotos por portafolio
            'galeria' => 'nullable|array|max:8', 
            'galeria.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            
            // Array de UUIDs de fotos que el talento decide eliminar
            'fotos_a_eliminar' => 'nullable|array',
            'fotos_a_eliminar.*' => 'string|uuid',
        ];
    }

    /**
     * Mensajes de error personalizados para el frontend.
     */
    public function messages()
    {
        return [
            'precio_base.min' => 'El precio base no puede ser un valor negativo.',
            'galeria.max' => 'No puedes subir más de 8 fotos a tu galería.',
            'galeria.*.image' => 'Todos los archivos de la galería deben ser imágenes válidas.',
            'password.min' => 'Si decides cambiar tu contraseña, debe tener al menos 8 caracteres.'
        ];
    }
}
