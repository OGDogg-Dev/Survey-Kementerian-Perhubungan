<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveySession extends Model
{
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'token',
        'answers_json',
        'meta_json',
        'expires_at',
        'completed_at',
    ];

    protected $casts = [
        'answers_json' => 'array',
        'meta_json' => 'array',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }
}
