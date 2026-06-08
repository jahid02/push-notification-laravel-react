<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'reader_id',
        'author_id',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * The reader (subscriber).
     */
    public function reader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reader_id');
    }

    /**
     * The author being subscribed to.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
