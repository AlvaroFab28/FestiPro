<?php

namespace App\Modules\Anfitrion\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Modules\Autenticacion\Models\User;
use App\Modules\Talento\Models\TalentProfile;

class Review extends Model
{
    use HasUuids;

    protected $table = 'reviews';

    public const UPDATED_AT = null;

    protected $fillable = [
        'host_id',
        'talent_profile_id',
        'rating',
        'comment'
    ];

    /**
     * Get the host (user) that wrote the review.
     */
    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    /**
     * Get the talent profile that received the review.
     */
    public function talentProfile()
    {
        return $this->belongsTo(TalentProfile::class, 'talent_profile_id');
    }
}
