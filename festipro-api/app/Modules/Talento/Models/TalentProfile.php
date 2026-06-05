<?php

namespace App\Modules\Talento\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TalentProfile extends Model
{
    use HasUuids;

    protected $table = 'talent_profiles';

    protected $fillable = [
        'user_id', 
        'category_id', 
        'city_id', 
        'artistic_name', 
        'bio', 
        'base_price', 
        'youtube_link', 
        'banner_url',
        'is_available',
        'profile_views',
        'average_rating'
    ];


    public function user()
    {
        return $this->belongsTo(\App\Modules\Autenticacion\Models\User::class, 'user_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(\App\Global\Models\Category::class, 'category_id');
    }

    public function city()
    {
        return $this->belongsTo(\App\Global\Models\City::class, 'city_id');
    }

    /**
     * Relación: Un Perfil de Talento tiene muchas fotos en su Galería (1-a-N)
     */
    public function galleries()
    {
        return $this->hasMany(TalentGallery::class, 'talent_profile_id', 'id');
    }

    /**
     * Relación: Un Perfil de Talento tiene muchas reseñas (1-a-N)
     */
    public function reviews()
    {
        return $this->hasMany(\App\Modules\Anfitrion\Models\Review::class, 'talent_profile_id', 'id');
    }
}
