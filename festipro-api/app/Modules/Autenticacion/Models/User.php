<?php

namespace App\Modules\Autenticacion\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids; // Inyecta soporte para IDs alfanuméricos
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes; // Permite el borrado lógico (oculta sin borrar de la DB)
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Requerido para crear tokens de sesión

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasUuids, SoftDeletes;

    /**
     * Los atributos que se pueden asignar de forma masiva (Mass Assignment).
     * Mapeamos exactamente los campos que configuramos en la base de datos.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_admin',
        'whatsapp_number',
        'avatar_url',
        'banned_at',
    ];

    /**
     * Los atributos que deben ocultarse cuando el modelo se convierte a JSON.
     * Esto protege datos sensibles para que no lleguen al frontend.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Define cómo se deben transformar los datos al leerlos/guardarlos en la base de datos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed', // Laravel encriptará automáticamente la contraseña
            'is_admin' => 'boolean', // Lo tratamos como true/false, no como 0/1
            'banned_at' => 'datetime', // Lo tratamos como fecha
        ];
    }

    /**
     * Relación: Un Usuario tiene un Perfil de Talento (1-a-1)
     */
    public function talentProfile()
    {
        return $this->hasOne(\App\Modules\Talento\Models\TalentProfile::class, 'user_id', 'id');
    }
}