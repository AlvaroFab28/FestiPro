<?php

namespace App\Modules\Anfitrion\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\Anfitrion\Models\Review;
use App\Modules\Talento\Models\TalentProfile;
use App\Global\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    use ApiResponseTrait;

    public function store(Request $request)
    {
        // 1. Validar que el rol sea Anfitrión (con o sin acento)
        $userRole = mb_strtolower(trim($request->user()->role), 'UTF-8');
        if ($userRole !== 'anfitrión' && $userRole !== 'anfitrion') {
            return $this->errorResponse('Solo los usuarios con rol de Anfitrión pueden calificar y dejar reseñas. (Tu rol actual: ' . $request->user()->role . ')', 403);
        }

        // 2. Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'talent_profile_id' => 'required|uuid|exists:talent_profiles,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422, $validator->errors()->toArray());
        }

        $talentProfileId = $request->input('talent_profile_id');
        $rating = $request->input('rating');
        $comment = $request->input('comment');

        // 3. Crear o actualizar la reseña (Upsert por host + perfil)
        $review = Review::updateOrCreate(
            [
                'host_id' => $request->user()->id,
                'talent_profile_id' => $talentProfileId,
            ],
            [
                'rating' => $rating,
                'comment' => $comment,
            ]
        );

        // 4. Recalcular el promedio de calificaciones del talento
        $averageRating = Review::where('talent_profile_id', $talentProfileId)->avg('rating');
        
        TalentProfile::where('id', $talentProfileId)->update([
            'average_rating' => round($averageRating, 2)
        ]);

        return $this->successResponse($review, 'Reseña guardada exitosamente.', 201);
    }
}
