<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GcashSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_name',
        'account_number',
        'qr_code_path',
    ];

    protected $appends = ['qr_code_url'];

    public function getQrCodeUrlAttribute(): ?string
    {
        if (! $this->qr_code_path) {
            return null;
        }

        try {
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($this->qr_code_path)) {
                $file = \Illuminate\Support\Facades\Storage::disk('public')->get($this->qr_code_path);
                $type = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($this->qr_code_path);
                $base64 = base64_encode($file);

                return 'data:'.$type.';base64,'.$base64;
            }
        } catch (\Exception $e) {
            // Fallback to relative URL if something goes wrong
            return '/storage/'.$this->qr_code_path;
        }

        return '/storage/'.$this->qr_code_path;
    }
}
