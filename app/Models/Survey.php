<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\SurveySession;
use App\Models\SurveyResponse;

class Survey extends Model
{
    protected $fillable = [
        'title','slug','schema_json','status','version','created_by','published_at','start_at','end_at'
    ];

    protected $casts = [
        'schema_json' => 'array',
        'published_at' => 'datetime',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function responses() {
        return $this->hasMany(SurveyResponse::class);
    }

    public function sessions()
    {
        return $this->hasMany(SurveySession::class);
    }
    public function scopePublished($q) {
        return $q->where('status','published');
    }
}
