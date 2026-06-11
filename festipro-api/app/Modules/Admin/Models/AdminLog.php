<?php

namespace App\Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Auth;

class AdminLog extends Model
{
    use HasUuids;

    protected $table = 'admin_logs';

    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'action',
        'target_type',
        'target_id',
        'details',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(\App\Modules\Autenticacion\Models\User::class, 'admin_id');
    }

    public static function log($action, $targetType = null, $targetId = null, $details = null)
    {
        $adminId = Auth::id() ?? request()->user()?->id;
        
        if (!$adminId) {
            return null;
        }

        return self::create([
            'admin_id' => $adminId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'details' => $details,
        ]);
    }
}
