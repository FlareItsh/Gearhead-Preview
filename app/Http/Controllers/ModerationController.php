<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\Discount;
use App\Models\GcashSetting;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ModerationController extends Controller
{
    public function index(): Response
    {
        $loyaltyThreshold = AppSetting::where('key', 'loyalty_free_wash_threshold')->first();

        $gcashSettings = GcashSetting::first() ?? new GcashSetting([
            'account_name' => '',
            'account_number' => '',
            'qr_code_path' => null,
        ]);

        return Inertia::render('Admin/Moderation', [
            'loyaltyThreshold' => $loyaltyThreshold ? (int) $loyaltyThreshold->value : 9,
            'gcashSettings' => $gcashSettings,
            'discounts' => Discount::with('services')->orderBy('created_at', 'desc')->get(),
            'services' => \App\Models\Service::all(),
            'reviews' => Review::with('user')->where('is_displayed', true)->orderBy('created_at', 'desc')->paginate(10),
        ]);
    }

    public function updateLoyalty(Request $request)
    {
        $request->validate([
            'threshold' => 'required|integer|min:1|max:100',
        ]);

        AppSetting::updateOrCreate(
            ['key' => 'loyalty_free_wash_threshold'],
            ['value' => (string) $request->threshold, 'group' => 'loyalty']
        );

        return back()->with('status', 'loyalty-threshold-updated');
    }

    public function updateGcash(Request $request)
    {
        $request->validate([
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:255'],
            'qr_code' => ['nullable', 'image', 'max:2048'],
        ]);

        $settings = GcashSetting::first() ?? new GcashSetting;

        $data = [
            'account_name' => $request->account_name,
            'account_number' => $request->account_number,
        ];

        if ($request->hasFile('qr_code')) {
            // Delete old QR code if exists
            if ($settings->qr_code_path) {
                Storage::disk('public')->delete($settings->qr_code_path);
            }

            $path = $request->file('qr_code')->store('gcash', 'public');
            $data['qr_code_path'] = $path;
        }

        $settings->fill($data)->save();

        return back()->with('status', 'gcash-settings-updated');
    }

    public function storeDiscount(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0'.($request->type === 'percentage' ? '|max:100' : ''),
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'required|boolean',
            'applies_to' => 'required|in:all,specific_services',
            'min_spend' => 'required|numeric|min:0',
            'service_ids' => 'required_if:applies_to,specific_services|array',
            'service_ids.*' => 'exists:services,service_id',
        ]);

        $discount = Discount::create($validated);

        if ($request->applies_to === 'specific_services') {
            $discount->services()->sync($request->service_ids);
        }

        return back()->with('status', 'discount-created');
    }

    public function updateDiscount(Request $request, int $id)
    {
        $discount = Discount::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0'.($request->type === 'percentage' ? '|max:100' : ''),
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'required|boolean',
            'applies_to' => 'required|in:all,specific_services',
            'min_spend' => 'required|numeric|min:0',
            'service_ids' => 'required_if:applies_to,specific_services|array',
            'service_ids.*' => 'exists:services,service_id',
        ]);

        $discount->update($validated);

        if ($request->applies_to === 'specific_services') {
            $discount->services()->sync($request->service_ids);
        } else {
            $discount->services()->detach();
        }

        return back()->with('status', 'discount-updated');
    }

    public function destroyDiscount(int $id)
    {
        $discount = Discount::findOrFail($id);
        $discount->delete();

        return back()->with('status', 'discount-deleted');
    }

    public function toggleReview(int $id)
    {
        $review = Review::findOrFail($id);
        $review->is_displayed = ! $review->is_displayed;
        $review->save();

        return back()->with('status', 'review-updated');
    }

    public function destroyReview(int $id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return back()->with('status', 'review-deleted');
    }

    public function getReviews(Request $request)
    {
        $status = $request->query('status', 'displayed'); // 'displayed' or 'hidden'
        $perPage = $request->query('per_page', 10);
        $search = $request->query('search', '');
        $rating = $request->query('rating', 'all');
        $sortBy = $request->query('sort_by', 'newest');

        $query = Review::with('user')
            ->when($status === 'displayed', function ($q) {
                return $q->where('is_displayed', true);
            })
            ->when($status === 'hidden', function ($q) {
                return $q->where('is_displayed', false);
            })
            ->when($rating !== 'all', function ($q) use ($rating) {
                return $q->where('rating', (int) $rating);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('comment', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($u) use ($search) {
                            $u->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            });

        // Sorting
        if ($sortBy === 'newest') {
            $query->orderBy('created_at', 'desc');
        } elseif ($sortBy === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } elseif ($sortBy === 'highest_rating') {
            $query->orderBy('rating', 'desc');
        } elseif ($sortBy === 'lowest_rating') {
            $query->orderBy('rating', 'asc');
        }

        return response()->json($query->paginate($perPage));
    }
}
