<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'Users';
    protected $primaryKey = 'user_id';
    public $incrementing = true;
    protected $keyType = 'int';

    // Your table has created_at/updated_at, so keep timestamps enabled
    public $timestamps = true;

    // Laravel expects password column named "password"
    // We'll map it to your "password_hash" column using getAuthPassword()
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    protected $fillable = [
        'email',
        'password_hash',
        'full_name',
        'phone',
        'date_of_birth',
        'gender',
        'account_status',
        'frozen_at',
        'frozen_by_user_id',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'frozen_at' => 'datetime',
    ];

    public function isFrozen(): bool
    {
        return !is_null($this->frozen_at) || ($this->account_status === 'Frozen');
    }
}