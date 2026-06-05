<?php

namespace App\Modules\Anfitrion\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Modules\Autenticacion\Models\User;
use App\Global\Models\Category;
use App\Global\Models\City;

class Event extends Model
{
    use HasUuids;

    protected $table = 'events';

    protected $fillable = [
        'host_id',
        'category_id',
        'city_id',
        'title',
        'description',
        'event_date',
        'estimated_budget',
        'status',
    ];

    /**
     * Get the host (user) that owns the event.
     */
    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    /**
     * Get the category for the event.
     */
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * Get the city for the event.
     */
    public function city()
    {
        return $this->belongsTo(City::class, 'city_id');
    }
}
