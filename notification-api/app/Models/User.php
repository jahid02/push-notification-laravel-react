<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'bio',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * Posts written by this author.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    /**
     * FCM device tokens registered by this user.
     */
    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    /**
     * Authors this user (reader) has subscribed to.
     */
    public function subscribedAuthors(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'subscriptions',
            'reader_id',
            'author_id'
        )->withTimestamps();
    }

    /**
     * Readers who have subscribed to this user (author).
     */
    public function subscribers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'subscriptions',
            'author_id',
            'reader_id'
        )->withTimestamps();
    }

    /**
     * Subscription pivot records where this user is the reader.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'reader_id');
    }

    /**
     * Notifications sent by this user (as author/admin).
     */
    public function sentNotifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'sender_id');
    }

    /**
     * Notification delivery records for this user (as recipient).
     */
    public function notificationRecipients(): HasMany
    {
        return $this->hasMany(NotificationRecipient::class);
    }

    // ─── Role Helpers ─────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isAuthor(): bool
    {
        return $this->role === 'author';
    }

    public function isReader(): bool
    {
        return $this->role === 'reader';
    }

    /**
     * Check if the user has any of the given roles.
     */
    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }
}

