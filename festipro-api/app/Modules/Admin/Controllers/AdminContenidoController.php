<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\Autenticacion\Models\User;
use App\Modules\Talento\Models\TalentProfile;
use App\Modules\Anfitrion\Models\Event;
use App\Global\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Storage;

class AdminContenidoController extends Controller
{
    use ApiResponseTrait;

    public function indexTalentos()
    {
        $talentos = TalentProfile::with(['user', 'category', 'city'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($talentos, 'Perfiles de talento obtenidos correctamente.');
    }

    public function destroyTalento($id)
    {
        $talentProfile = TalentProfile::find($id);

        if (!$talentProfile) {
            return $this->errorResponse('Perfil de talento no encontrado.', 404);
        }

        $artisticName = $talentProfile->artistic_name;

        // Soft delete user if exists
        $user = $talentProfile->user;
        if ($user) {
            $user->delete();
        }

        $talentProfile->delete();

        \App\Modules\Admin\Models\AdminLog::log(
            'delete_talent_profile',
            'talent_profile',
            $id,
            "Se eliminó permanentemente el perfil de talento: {$artisticName} (y su usuario asociado)"
        );

        return $this->successResponse(null, 'Perfil de talento y su usuario asociado han sido eliminados.');
    }

    public function indexEventos()
    {
        $eventos = Event::with(['host', 'category', 'city'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($eventos, 'Eventos obtenidos correctamente.');
    }

    public function destroyEvento($id)
    {
        $evento = Event::find($id);

        if (!$evento) {
            return $this->errorResponse('Evento no encontrado.', 404);
        }

        $title = $evento->title;
        $evento->delete();

        \App\Modules\Admin\Models\AdminLog::log(
            'delete_event',
            'event',
            $id,
            "Se eliminó permanentemente el evento: {$title}"
        );

        return $this->successResponse(null, 'Evento eliminado correctamente.');
    }

    public function showTalento($id)
    {
        $talento = TalentProfile::with(['user', 'category', 'city', 'galleries'])
            ->find($id);

        if (!$talento) {
            return $this->errorResponse('Perfil de talento no encontrado.', 404);
        }

        return $this->successResponse($talento, 'Detalle del talento obtenido correctamente.');
    }

    public function destroyTalentoFoto($talentoId, $fotoId)
    {
        $talentProfile = TalentProfile::find($talentoId);
        if (!$talentProfile) {
            return $this->errorResponse('Perfil de talento no encontrado.', 404);
        }

        $foto = $talentProfile->galleries()->find($fotoId);
        if (!$foto) {
            return $this->errorResponse('Foto no encontrada en la galería de este talento.', 404);
        }

        if ($foto->image_url) {
            $path = str_replace('/storage/', '', $foto->image_url);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $foto->delete();

        \App\Modules\Admin\Models\AdminLog::log(
            'delete_talent_photo',
            'talent_profile',
            $talentoId,
            "Se eliminó una foto de la galería del talento: {$talentProfile->artistic_name}"
        );

        return $this->successResponse(null, 'Foto de galería eliminada correctamente.');
    }

    public function clearTalentoDescripcion($id)
    {
        $talentProfile = TalentProfile::find($id);

        if (!$talentProfile) {
            return $this->errorResponse('Perfil de talento no encontrado.', 404);
        }

        $talentProfile->bio = '';
        $talentProfile->save();

        \App\Modules\Admin\Models\AdminLog::log(
            'clear_talent_bio',
            'talent_profile',
            $id,
            "Se borró la biografía del talento: {$talentProfile->artistic_name}"
        );

        return $this->successResponse(null, 'Descripción/biografía del talento eliminada.');
    }

    public function clearTalentoAvatar($id)
    {
        $talentProfile = TalentProfile::find($id);

        if (!$talentProfile) {
            return $this->errorResponse('Perfil de talento no encontrado.', 404);
        }

        $user = $talentProfile->user;
        if (!$user) {
            return $this->errorResponse('Usuario asociado no encontrado.', 404);
        }

        if ($user->avatar_url) {
            $path = str_replace('/storage/', '', $user->avatar_url);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $user->avatar_url = null;
        $user->save();

        \App\Modules\Admin\Models\AdminLog::log(
            'clear_talent_avatar',
            'talent_profile',
            $id,
            "Se borró el avatar del talento: {$talentProfile->artistic_name}"
        );

        return $this->successResponse(null, 'Avatar del talento eliminado.');
    }

    public function clearTalentosBanner($id)
    {
        $talentProfile = TalentProfile::find($id);

        if (!$talentProfile) {
            return $this->errorResponse('Perfil de talento no encontrado.', 404);
        }

        if ($talentProfile->banner_url) {
            $path = str_replace('/storage/', '', $talentProfile->banner_url);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $talentProfile->banner_url = null;
        $talentProfile->save();

        \App\Modules\Admin\Models\AdminLog::log(
            'clear_talent_banner',
            'talent_profile',
            $talentProfile->id,
            "Se eliminó el banner del talento: {$talentProfile->artistic_name}"
        );

        return $this->successResponse(null, 'Banner del talento eliminado.');
    }

    public function showEvento($id)
    {
        $evento = Event::with(['host', 'category', 'city'])->find($id);

        if (!$evento) {
            return $this->errorResponse('Evento no encontrado.', 404);
        }

        return $this->successResponse($evento, 'Detalle del evento obtenido correctamente.');
    }

    public function closeEvento($id)
    {
        $evento = Event::find($id);

        if (!$evento) {
            return $this->errorResponse('Evento no encontrado.', 404);
        }

        $evento->status = 'cerrado';
        $evento->save();

        \App\Modules\Admin\Models\AdminLog::log(
            'close_event',
            'event',
            $evento->id,
            "Se cerró el evento: {$evento->title}"
        );

        return $this->successResponse($evento, 'Evento cerrado correctamente.');
    }
}
