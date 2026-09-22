<?php

namespace App\Http\Requests\Settings;

use App\Support\VehicleSizeResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCarRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'make' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:'.(date('Y') + 1)],
            'plate_number' => ['nullable', 'string', 'max:20'],
            'color' => ['nullable', 'string', 'max:50'],
            'size' => ['nullable', 'in:Small,Medium,Large,X-Large,XX-Large'],
            'fuel_type' => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $make = (string) $this->input('make', '');
            $model = (string) $this->input('model', '');

            if ($make === '' || $model === '') {
                return;
            }

            if (! app(VehicleSizeResolver::class)->hasExactVehicle($make, $model)) {
                $validator->errors()->add(
                    'model',
                    'Please choose an existing car model from the suggestions.'
                );
            }
        });
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'make.required' => 'The car make field is required.',
            'model.required' => 'The car model field is required.',
            'year.integer' => 'The year must be a valid integer.',
            'year.min' => 'The year must be at least 1900.',
            'year.max' => 'The year cannot be in the future.',
        ];
    }
}
