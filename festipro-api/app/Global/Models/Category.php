<?php

namespace App\Global\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'icon_url', 'is_active'];
    public $timestamps = true;

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
