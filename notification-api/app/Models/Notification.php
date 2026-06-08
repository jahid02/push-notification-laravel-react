<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends Model
{
    protected $fillable = [
        'post_id',
        'sender_id',
        'title',
        'body',
        'image_url',
        'target',
        'data',
        'total_recipients',
        'success_count',
        'failure_count',
        'status',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'data'             => 'array',
            'total_recipients' => 'integer',
            'success_count'    => 'integer',
            'failure_count'    => 'integer',
            'sent_at'          => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * The post that triggered this notification (null for admin broadcasts).
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * The author/admin who sent this notification.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Individual per-device delivery records.
     */
    public function recipients(): HasMany
    {
        return $this->hasMany(NotificationRecipient::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeBySender(Builder $query, int $senderId): Builder
    {
        return $query->where('sender_id', $senderId);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Calculate the delivery success rate as a percentage.
     */
    public function successRate(): float
    {
        if ($this->total_recipients === 0) {
            return 0.0;
        }

        return round(($this->success_count / $this->total_recipients) * 100, 2);
    }

    /**
     * Mark the notification as processing.
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    /**
     * Mark the notification as completed and record the sent timestamp.
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status'  => 'completed',
            'sent_at' => now(),
        ]);
    }

    /**
     * Mark the notification as failed.
     */
    public function markAsFailed(): void
    {
        $this->update(['status' => 'failed']);
    }
}
