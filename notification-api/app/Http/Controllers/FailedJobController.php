<?php

namespace App\Http\Controllers;

use App\Services\FailedJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FailedJobController extends Controller
{
    public function __construct(
        private readonly FailedJobService $failedJobService
    ) {}

    /**
     * Display a listing of failed jobs.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 15);
        $failedJobs = $this->failedJobService->listFailedJobs($perPage);

        return response()->json([
            'success' => true,
            'data'    => $failedJobs,
        ]);
    }

    /**
     * Display the specified failed job details.
     */
    public function show(int $id): JsonResponse
    {
        $job = $this->failedJobService->getFailedJob($id);

        if (!$job) {
            abort(404, 'Failed job not found.');
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'failed_job' => $job,
            ],
        ]);
    }

    /**
     * Retry a specific failed job.
     */
    public function retry(int $id): JsonResponse
    {
        $success = $this->failedJobService->retryJob($id);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retry job. It may have already been retried or deleted.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Job retried successfully and pushed back onto the queue.',
        ]);
    }

    /**
     * Delete/forget a specific failed job.
     */
    public function destroy(int $id): JsonResponse
    {
        $success = $this->failedJobService->deleteJob($id);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete job. It may have already been deleted.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Failed job deleted successfully.',
        ]);
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAll(): JsonResponse
    {
        $success = $this->failedJobService->retryAllJobs();

        return response()->json([
            'success' => $success,
            'message' => $success ? 'All failed jobs have been queued for retry.' : 'Failed to queue all jobs for retry.',
        ]);
    }

    /**
     * Delete all failed jobs.
     */
    public function destroyAll(): JsonResponse
    {
        $success = $this->failedJobService->deleteAllJobs();

        return response()->json([
            'success' => $success,
            'message' => $success ? 'All failed jobs have been deleted.' : 'Failed to delete all jobs.',
        ]);
    }
}
