<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $primaryKey = 'discount_id';

    protected $fillable = [
        'name',
        'type',
        'value',
        'valid_from',
        'valid_to',
        'is_active',
        'applies_to',
        'min_spend',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_to' => 'datetime',
        'is_active' => 'boolean',
        'min_spend' => 'decimal:2',
    ];

    /**
     * Scope for active and valid discounts.
     */
    public function scopeActive(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_from')
                    ->orWhere('valid_from', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $now);
            });
    }

    /**
     * Scope for current and upcoming discounts for promotional display.
     */
    public function scopeAdvertisable(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $now);
            })
            ->orderBy('valid_from', 'asc');
    }

    /**
     * Get the best active discount (highest reduction).
     */
    public static function getBestActiveDiscount(float $totalAmount = 0, array $items = []): ?self
    {
        $discounts = self::active()
            ->where('min_spend', '<=', $totalAmount)
            ->get();

        if ($discounts->isEmpty()) {
            return null;
        }

        // Filter based on specific services if items are provided
        if (! empty($items)) {
            $orderServiceIds = collect($items)->pluck('service_id')->toArray();
            $discounts = $discounts->filter(function ($discount) use ($orderServiceIds) {
                if ($discount->applies_to === 'all') {
                    return true;
                }

                return $discount->services()->whereIn('services.service_id', $orderServiceIds)->exists();
            });
        }

        if ($discounts->isEmpty()) {
            return null;
        }

        // Map discounts to their actual reduction value for the given total and items
        return $discounts->sortByDesc(function ($discount) use ($totalAmount, $items) {
            return $discount->calculateReduction($totalAmount, $items);
        })->first();
    }

    /**
     * Calculate the discount amount for a given total.
     */
    public function calculateReduction(float $totalAmount, array $items = []): float
    {
        // If this discount is for specific services and we have item details,
        // we calculate reduction based ONLY on those eligible services.
        if ($this->applies_to === 'specific_services' && ! empty($items)) {
            $eligibleServiceIds = $this->services()->pluck('services.service_id')->toArray();
            $eligibleTotal = collect($items)
                ->filter(fn ($item) => in_array($item['service_id'], $eligibleServiceIds))
                ->sum('price');

            if ($eligibleTotal <= 0) {
                return 0.00;
            }

            $reduction = $this->type === 'percentage'
                ? ($eligibleTotal * min(100, $this->value)) / 100
                : (float) $this->value;

            return min($reduction, $totalAmount);
        }

        // Default global behavior
        $reduction = $this->type === 'percentage'
            ? ($totalAmount * min(100, $this->value)) / 100
            : (float) $this->value;

        return min($reduction, $totalAmount);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'discount_service', 'discount_id', 'service_id');
    }
}
