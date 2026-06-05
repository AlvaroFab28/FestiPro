<?php

namespace App\Modules\Anfitrion\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Modules\Autenticacion\Models\User;
use App\Modules\Talento\Models\TalentProfile;

class Favorite extends Model
{
    use HasUuids;

    protected $table = 'favorites';
    
    // Solo tenemos created_at en la migración
    public const UPDATED_AT = null;

    protected $fillable = [
        'host_id',
        'talent_profile_id'
    ];

    /**
     * Get the host (user) that owns the favorite.
     */
    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    /**
     * Get the talent profile that is favorited.
     */
    public function talentProfile()
    {
        return $this->belongsTo(TalentProfile::class, 'talent_profile_id');
    }
}
