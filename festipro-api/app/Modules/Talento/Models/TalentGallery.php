<?php

namespace App\Modules\Talento\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TalentGallery extends Model
{
    use HasUuids;

    protected $table = 'talent_galleries';

    protected $fillable = [
        'talent_profile_id',
        'image_url'
    ];

    const UPDATED_AT = null;
}
