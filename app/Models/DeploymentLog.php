<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeploymentLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['project_name', 'branch', 'status', 'output', 'deployed_at'];

    protected $casts = ['deployed_at' => 'datetime'];
}
