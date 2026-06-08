import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { 
  RefreshCcw, 
  Trash2, 
  Eye, 
  Flame, 
  Terminal 
} from 'lucide-react';
import toast from 'react-hot-toast';

const FailedJobsPage = () => {
  const [failedJobs, setFailedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Selected Job Details Pane
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchFailedJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      const response = await api.get('/failed-jobs', { params });
      if (response.data && response.data.success) {
        const payload = response.data.data;
        setFailedJobs(payload.data || []);
        setCurrentPage(payload.current_page || 1);
        setTotalPages(payload.last_page || 1);
        setTotalItems(payload.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load queue failed jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedJobs();
  }, [currentPage]);

  const handleFetchJobDetail = async (jobId) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/failed-jobs/${jobId}`);
      if (response.data && response.data.success) {
        setSelectedJob(response.data.data.failed_job);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load job stack trace.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      const response = await api.post(`/failed-jobs/${jobId}/retry`);
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Job retried and pushed back to active queue!');
        if (selectedJob?.id === jobId) setSelectedJob(null);
        fetchFailedJobs();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retry job.');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to forget/delete this failed job?')) {
      return;
    }
    try {
      const response = await api.delete(`/failed-jobs/${jobId}`);
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Failed job forgot successfully.');
        if (selectedJob?.id === jobId) setSelectedJob(null);
        fetchFailedJobs();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete job.');
    }
  };

  const handleRetryAll = async () => {
    if (!confirm('Are you sure you want to retry all failed jobs currently in database?')) {
      return;
    }
    try {
      const response = await api.post('/failed-jobs/retry-all');
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'All failed jobs have been queued for retry.');
        setSelectedJob(null);
        fetchFailedJobs();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retry all jobs.');
    }
  };

  const handleFlushAll = async () => {
    if (!confirm('WARNING: Are you sure you want to flush/delete ALL failed jobs? This is permanent.')) {
      return;
    }
    try {
      const response = await api.delete('/failed-jobs/flush');
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'All failed jobs deleted.');
        setSelectedJob(null);
        fetchFailedJobs();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to flush jobs.');
    }
  };

  const formatPayload = (payloadStr) => {
    try {
      const parsed = JSON.parse(payloadStr);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return payloadStr;
    }
  };

  const headers = [
    { key: 'id', label: 'ID', skeletonWidth: '20px' },
    { 
      key: 'queue', 
      label: 'Queue Name', 
      skeletonWidth: '80px',
      render: (val) => <span className="font-mono text-xs text-accent-secondary">{val}</span>
    },
    { 
      key: 'payload', 
      label: 'Job Class / Target', 
      skeletonWidth: '160px',
      render: (payload) => {
        try {
          const parsed = JSON.parse(payload);
          const displayName = parsed.displayName || parsed.job || 'Unknown Job';
          return displayName.substring(displayName.lastIndexOf('\\') + 1);
        } catch (e) {
          return 'Invalid Payload';
        }
      }
    },
    { 
      key: 'exception', 
      label: 'Exception Summary', 
      skeletonWidth: '220px',
      render: (val) => {
        const firstLine = val.split('\n')[0];
        return firstLine.length > 70 ? `${firstLine.substring(0, 70)}...` : firstLine;
      }
    },
    { 
      key: 'failed_at', 
      label: 'Failed Time', 
      skeletonWidth: '100px',
      render: (val) => new Date(val).toLocaleString() 
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      skeletonWidth: '80px',
      render: (_, row) => (
        <div className="flex gap-1.5 justify-end">
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg bg-white/[0.03] border border-border-color text-text-secondary cursor-pointer hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-light transition-colors"
            onClick={() => handleFetchJobDetail(row.id)}
            title="Inspect Job"
          >
            <Eye size={13} />
          </button>
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-border-glow hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-colors cursor-pointer"
            onClick={() => handleRetryJob(row.id)}
            title="Retry Job"
          >
            <RefreshCcw size={13} />
          </button>
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
            onClick={() => handleDeleteJob(row.id)}
            title="Delete Log"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  const bulkActions = (
    <div className="flex gap-3 flex-wrap">
      <button
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-border-color text-text-primary font-semibold text-xs rounded-xl hover:bg-bg-surface-hover hover:border-border-light transition-all cursor-pointer"
        onClick={handleRetryAll}
        disabled={failedJobs.length === 0}
      >
        <RefreshCcw size={14} />
        <span>Queue Retry All ({totalItems})</span>
      </button>
      <button
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-danger/10 text-danger border border-danger/20 font-semibold text-xs rounded-xl hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
        onClick={handleFlushAll}
        disabled={failedJobs.length === 0}
      >
        <Flame size={14} />
        <span>Flush All Database Logs</span>
      </button>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all duration-300">
        
        {/* DataTable Grid */}
        <div className={selectedJob ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <DataTable
            headers={headers}
            data={failedJobs}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            actions={bulkActions}
          />
        </div>

        {/* Sidebar Inspector Panel */}
        {selectedJob && (
          <div className="lg:col-span-4 bg-bg-glass border border-border-color rounded-2xl p-6 h-fit animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-color mb-1">
              <div className="flex items-center gap-2 text-danger">
                <Terminal size={18} />
                <h4 className="text-base font-semibold text-text-primary font-display">Log Diagnostics [ID: {selectedJob.id}]</h4>
              </div>
              <button 
                className="px-2 py-1 bg-white/[0.05] border border-border-color text-text-primary text-xs font-semibold rounded-lg hover:bg-bg-surface-hover hover:border-border-light transition-colors"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center min-h-[180px]">
                <div className="w-8 h-8 border-3 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.01] p-3 rounded-lg border border-border-color">
                    <span className="text-[10px] text-text-muted block uppercase tracking-wider">Queue Connection</span>
                    <span className="font-semibold text-text-primary text-sm mt-0.5 block">{selectedJob.connection}</span>
                  </div>
                  <div className="bg-white/[0.01] p-3 rounded-lg border border-border-color">
                    <span className="text-[10px] text-text-muted block uppercase tracking-wider">Queue Tube</span>
                    <span className="font-semibold text-text-primary text-sm mt-0.5 block">{selectedJob.queue}</span>
                  </div>
                </div>

                {/* Serialized Payload */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Job Payload Definition</label>
                  <pre className="font-mono bg-[#02040a] border border-border-color rounded-lg p-4 text-[#39c5bb] text-xs overflow-x-auto max-w-full max-h-[180px] overflow-y-auto whitespace-pre">
                    {formatPayload(selectedJob.payload)}
                  </pre>
                </div>

                {/* Stack Trace */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Exception Stack Trace</label>
                  <div className="max-h-[260px] overflow-y-auto font-mono text-[11px] bg-[#120404] text-[#fca5a5] p-3 rounded-xl border border-danger/20 whitespace-pre-wrap leading-relaxed">
                    {selectedJob.exception}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 border-t border-border-color pt-4 justify-end">
                  <button
                    className="px-4 py-2 bg-danger/10 text-danger border border-danger/20 font-semibold text-xs rounded-xl hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
                    onClick={() => handleDeleteJob(selectedJob.id)}
                  >
                    Forget
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white font-semibold text-xs rounded-xl hover:-translate-y-0.5 hover:shadow-lg focus:outline-none transition-all cursor-pointer"
                    onClick={() => handleRetryJob(selectedJob.id)}
                  >
                    <RefreshCcw size={14} />
                    <span>Retry Dispatch</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FailedJobsPage;
