<?php

namespace App\Traits;

trait HasFullName
{
    /**
     * Get the full name (First + Middle + Last).
     */
    public function getFullNameAttribute(): string
    {
        $middle = $this->middle_name ? ' '.$this->middle_name : '';

        return trim("{$this->first_name}{$middle} {$this->last_name}");
    }

    /**
     * Get the short name (First + Last).
     */
    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
