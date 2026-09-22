<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\GcashSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GcashController extends Controller
{
    public function edit(): Response
    {
        $settings = GcashSetting::first() ?? new GcashSetting([
            'account_name' => '',
            'account_number' => '',
            'qr_code_path' => null,
        ]);

        return Inertia::render('settings/gcash', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
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
}
