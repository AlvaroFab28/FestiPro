<?php

namespace App\Modules\Anfitrion\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EventoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Autorización delegada al middleware o controlador, permitimos pasar al validador
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'city_id' => ['required', 'integer', 'exists:cities,id'],
            'event_date' => ['required', 'date', 'after_or_equal:today'],
            'estimated_budget' => ['required', 'numeric', 'min:0'],
            'description' => ['required', 'string'],
        ];

        // Si es una actualización (PUT/PATCH), validamos opcionalmente el status
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $rules['status'] = ['sometimes', 'required', 'string', Rule::in(['abierto', 'cerrado', 'cancelado'])];
        }

        return $rules;
    }

    /**
     * Mensajes personalizados de validación.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'El título del evento es obligatorio.',
            'category_id.exists' => 'La categoría seleccionada no es válida.',
            'city_id.exists' => 'La ciudad seleccionada no es válida.',
            'event_date.after_or_equal' => 'La fecha del evento no puede ser anterior al día de hoy.',
            'estimated_budget.min' => 'El presupuesto estimado no puede ser negativo.',
            'status.in' => 'El estado solo puede ser abierto, cerrado o cancelado.',
        ];
    }
}
