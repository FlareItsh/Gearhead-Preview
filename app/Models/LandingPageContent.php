<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LandingPageContent extends Model
{
    use HasFactory;

    protected $table = 'landing_page_contents';

    protected $primaryKey = 'landing_page_id';

    protected $fillable = [
        'last_edited_by',
        'title',
        'texts',
        'image_path',
    ];

    public function lastEditedBy()
    {
        return $this->belongsTo(User::class, 'last_edited_by', 'user_id');
    }
}
