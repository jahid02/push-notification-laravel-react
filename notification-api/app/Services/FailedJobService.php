<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class FailedJobService
{
    /**
     * List all failed jobs with decoded payload details.
     */
    public function listFailedJobs(int $perPage = 15): LengthAwarePaginator
    {
        $paginator = DB::table('failed_jobs')
            ->orderBy('failed_at', 'desc')
            ->paginate($perPage);

        // Transform collection to format payload display names
        $paginator->getCollection()->transform(function ($job) {
            return $this->formatFailedJob($job);
        });

        return $paginator;
    }

    /**
     * Get details of a single failed job.
     */
    public function getFailedJob(int $id): ?object
    {
        $job = DB::table('failed_jobs')->where('id', $id)->first();

        if (!$job) {
            return null;
        }

        return $this->formatFailedJob($job);
    }

    /**
     * Retry a specific failed job.
     */
    public function retryJob(int $id): bool
    {
        $exists = DB::table('failed_jobs')->where('id', $id)->exists();

        if (!$exists) {
            return false;
        }

        // Call Laravel's built-in artisan command to retry the job
        $exitCode = Artisan::call('queue:retry', [
            'id' => [$id]
        ]);

        return $exitCode === 0;
    }

    /**
     * Delete/forget a specific failed job.
     */
    public function deleteJob(int $id): bool
    {
        $exists = DB::table('failed_jobs')->where('id', $id)->exists();

        if (!$exists) {
            return false;
        }

        // Remove the job from failed_jobs table
        $exitCode = Artisan::call('queue:forget', [
            'id' => $id
        ]);

        return $exitCode === 0;
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAllJobs(): bool
    {
        $exitCode = Artisan::call('queue:retry', [
            'id' => ['all']
        ]);

        return $exitCode === 0;
    }

    /**
     * Flush all failed jobs.
     */
    public function deleteAllJobs(): bool
    {
        $exitCode = Artisan::call('queue:flush');

        return $exitCode === 0;
    }

    /**
     * Parse and format payload properties for cleaner UI display.
     */
    private function formatFailedJob(object $job): object
    {
        $payload = json_decode($job->payload, true);
        
        $displayName = $payload['displayName'] ?? 'Unknown Job';
        
        // If it's a generic queued handler, attempt to extract the command/job class name
        if (($displayName === 'Illuminate\Queue\CallQueuedHandler' || $displayName === 'Illuminate\Events\CallQueuedListener') 
            && isset($payload['data']['commandName'])) {
            $displayName = $payload['data']['commandName'];
        }

        $job->display_name = $displayName;
        
        // Parse raw command payload if possible to extract parameters
        $job->parsed_data = null;
        if (isset($payload['data']['command'])) {
            // We can check if command is unserializable, but it is a binary blob in queue.
            // So we just keep it simple.
        }

        return $job;
    }
}
