<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:20'],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                // Ignore the currently authenticated user's id when checking uniqueness.
                // The users table uses `user_id` as the primary key, not `id`.
                // Pass the primary key column name to `ignore()` so the
                // generated query uses `user_id <> ?` instead of `id <> ?`.
                Rule::unique(User::class)->ignore(Auth::id(), 'user_id'),
            ],
        ];
    }
}
