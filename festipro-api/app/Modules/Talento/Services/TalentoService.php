<?php

namespace App\Modules\Talento\Services;

use App\Modules\Autenticacion\Models\User;
use App\Modules\Talento\Models\TalentProfile;
use App\Modules\Talento\Models\TalentGallery;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class TalentoService
{
    /**
     * Tarea 3.2: Lógica de Upsert Transaccional.
     * Si el guardado de la BD o la subida de fotos falla, se revierte todo (Rollback).
     */
    public function upsertPerfil(User $user, array $data, $files)
    {
        return DB::transaction(function () use ($user, $data, $files) {
            
            // ==========================================
            // 1. Actualizar tabla 'users'
            // ==========================================
            $user->name = $data['nombre_completo'];
            if (isset($data['email'])) {
                $user->email = $data['email'];
            }
            
            if (isset($data['telefono_whatsapp'])) {
                $user->whatsapp_number = $data['telefono_whatsapp'];
            }
            
            // Hashear y guardar contraseña SOLO si el usuario escribió una nueva
            if (!empty($data['password'])) {
                $user->password = Hash::make($data['password']);
            }

            // Procesar Avatar (Foto de perfil del usuario)
            if (isset($files['avatar'])) {
                // Borrar el anterior físicamente del disco si ya existía
                if ($user->avatar_url) {
                    $oldPath = str_replace('/storage/', '', $user->avatar_url);
                    Storage::disk('public')->delete($oldPath);
                }
                // Guardar la nueva imagen
                $path = $files['avatar']->store('talentos/avatars', 'public');
                $user->avatar_url = '/storage/' . $path;
            }
            $user->save();

            // ==========================================
            // 2. Upsert tabla 'talent_profiles' (Opcional)
            // ==========================================
            if (!empty($data['nombre_artistico'])) {
                $profileData = [
                    'category_id' => $data['categoria_id'],
                    'city_id' => $data['ciudad_id'],
                    'artistic_name' => $data['nombre_artistico'],
                    'bio' => $data['biografia'] ?? '', // Default para evitar Constraint Violation (Column cannot be null)
                    'base_price' => $data['precio_base'],
                    'youtube_link' => $data['youtube_link'] ?? '', // Igual aquí
                ];

                // Procesar Banner (Foto de portada)
                if (isset($files['banner'])) {
                    $profile = $user->talentProfile;
                    if ($profile && $profile->banner_url) {
                        $oldPath = str_replace('/storage/', '', $profile->banner_url);
                        Storage::disk('public')->delete($oldPath);
                    }
                    $path = $files['banner']->store('talentos/banners', 'public');
                    $profileData['banner_url'] = '/storage/' . $path;
                }

                // Magia de Eloquent: Busca por user_id. Si existe, lo actualiza. Si no, lo inserta.
                $talentProfile = TalentProfile::updateOrCreate(
                    ['user_id' => $user->id],
                    $profileData
                );

                // ==========================================
                // 3. Manejo de Galería de Imágenes (1-a-N)
                // ==========================================
                
                // a) Eliminar fotos seleccionadas por el usuario desde la UI
                if (!empty($data['fotos_a_eliminar'])) {
                    $fotos = TalentGallery::whereIn('id', $data['fotos_a_eliminar'])
                                          ->where('talent_profile_id', $talentProfile->id)
                                          ->get();
                                          
                    foreach ($fotos as $foto) {
                        $path = str_replace('/storage/', '', $foto->image_url);
                        Storage::disk('public')->delete($path);
                        $foto->delete();
                    }
                }

                // b) Subir e insertar nuevas fotos al portafolio
                if (isset($files['galeria']) && is_array($files['galeria'])) {
                    foreach ($files['galeria'] as $file) {
                        $path = $file->store('talentos/galerias', 'public');
                        
                        TalentGallery::create([
                            'talent_profile_id' => $talentProfile->id,
                            'image_url' => '/storage/' . $path
                        ]);
                    }
                }
            }

            // 4. Refrescamos el usuario con todas sus relaciones frescas para retornarlo a la UI
            $user->load('talentProfile.galleries');
            
            return $user;
        });
    }
}
