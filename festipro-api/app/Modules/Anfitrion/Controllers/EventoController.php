<?php

namespace App\Modules\Anfitrion\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\Anfitrion\Models\Event;
use App\Modules\Anfitrion\Requests\EventoRequest;
use App\Global\Traits\ApiResponseTrait;

class EventoController extends Controller
{
    use ApiResponseTrait;

    /**
     * Listar los eventos del anfitrión autenticado.
     */
    public function index(Request $request)
    {
        $eventos = Event::with(['category', 'city'])
            ->where('host_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return $this->successResponse($eventos, 'Eventos obtenidos correctamente.');
    }

    /**
     * Crear un nuevo evento.
     */
    public function store(EventoRequest $request)
    {
        $data = $request->validated();
        
        // Inyectamos el ID del usuario autenticado como host
        $data['host_id'] = $request->user()->id;
        
        $evento = Event::create($data);
        
        // Cargamos las relaciones para devolver la respuesta completa al frontend
        $evento->load(['category', 'city']);
        
        return $this->successResponse($evento, 'Evento publicado exitosamente.', 201);
    }

    /**
     * Actualizar un evento existente.
     */
    public function update(EventoRequest $request, $id)
    {
        $evento = Event::find($id);
        
        if (!$evento) {
            return $this->errorResponse('El evento solicitado no existe.', 404);
        }
        
        // Validación de Tenencia (Seguridad vital)
        if ($evento->host_id !== $request->user()->id) {
            return $this->errorResponse('No tienes permiso para editar este evento.', 403);
        }
        
        $evento->update($request->validated());
        $evento->load(['category', 'city']);
        
        return $this->successResponse($evento, 'Evento actualizado con éxito.');
    }

    /**
     * Eliminar permanentemente un evento.
     */
    public function destroy(Request $request, $id)
    {
        $evento = Event::find($id);
        
        if (!$evento) {
            return $this->errorResponse('El evento solicitado no existe.', 404);
        }
        
        // Validación de Tenencia
        if ($evento->host_id !== $request->user()->id) {
            return $this->errorResponse('No tienes permiso para eliminar este evento.', 403);
        }
        
        $evento->delete();
        
        return $this->successResponse(null, 'Evento eliminado de forma permanente.');
    }
}
