<?php

namespace App\Global\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'icon_class', 'is_active'];
    public $timestamps = true;

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function talentProfiles()
    {
        return $this->hasMany(\App\Modules\Talento\Models\TalentProfile::class, 'category_id');
    }
}
