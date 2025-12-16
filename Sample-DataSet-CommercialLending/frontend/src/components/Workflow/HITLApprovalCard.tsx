// HITL Approval Card - Shows pending mappings that require human approval

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Checkbox,
  Alert,
  CircularProgress,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  DoneAll as ApproveAllIcon,
  Clear as RejectAllIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface MappingCandidate {
  mapping_id: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  confidence: number;
  rationale: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface HITLApprovalCardProps {
  runId: string;
  mappings: MappingCandidate[];
  onApprovalComplete?: () => void;
}

export const HITLApprovalCard: React.FC<HITLApprovalCardProps> = ({
  runId,
  mappings,
  onApprovalComplete,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [localMappings, setLocalMappings] = useState<MappingCandidate[]>(mappings);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update local mappings when props change
  React.useEffect(() => {
    setLocalMappings(mappings);
  }, [mappings]);

  const handleApprove = (mappingId: string) => {
    setLocalMappings(prev => 
      prev.map(m => m.mapping_id === mappingId ? { ...m, status: 'approved' as const } : m)
    );
  };

  const handleReject = (mappingId: string) => {
    setLocalMappings(prev => 
      prev.map(m => m.mapping_id === mappingId ? { ...m, status: 'rejected' as const } : m)
    );
  };

  const handleApproveAll = () => {
    setLocalMappings(prev => 
      prev.map(m => ({ ...m, status: 'approved' as const }))
    );
  };

  const handleRejectAll = () => {
    setLocalMappings(prev => 
      prev.map(m => ({ ...m, status: 'rejected' as const }))
    );
  };

  const handleToggleSelect = (mappingId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mappingId)) {
        newSet.delete(mappingId);
      } else {
        newSet.add(mappingId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === localMappings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(localMappings.map(m => m.mapping_id)));
    }
  };

  const handleApproveSelected = () => {
    setLocalMappings(prev => 
      prev.map(m => selectedIds.has(m.mapping_id) ? { ...m, status: 'approved' as const } : m)
    );
    setSelectedIds(new Set());
  };

  const handleRejectSelected = () => {
    setLocalMappings(prev =>
      prev.map(m => selectedIds.has(m.mapping_id) ? { ...m, status: 'rejected' as const } : m)
    );
    setSelectedIds(new Set());
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const approvals = localMappings.map(m => ({
        mapping_id: m.mapping_id,
        status: m.status === 'pending' ? 'approved' : m.status, // Default pending to approved
      }));

      await api.post(`/hitl/approve/${runId}`, { approvals });
      
      if (onApprovalComplete) {
        onApprovalComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit approvals');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = localMappings.filter(m => m.status === 'pending').length;
  const approvedCount = localMappings.filter(m => m.status === 'approved').length;
  const rejectedCount = localMappings.filter(m => m.status === 'rejected').length;
  const allReviewed = pendingCount === 0;

  const getConfidenceColor = (confidence: number): 'error' | 'warning' | 'success' => {
    if (confidence < 0.7) return 'error';
    if (confidence < 0.9) return 'warning';
    return 'success';
  };

  const formatConfidence = (confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: 2, 
        borderColor: 'warning.main',
        bgcolor: 'warning.50',
        boxShadow: '0 0 20px rgba(255, 152, 0, 0.3)',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold" color="warning.dark">
              Human Approval Required
            </Typography>
            <Chip 
              label={`${pendingCount} pending`}
              size="small"
              color="warning"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Box>

        {/* Status Summary */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip 
            icon={<ApproveIcon />} 
            label={`Approved: ${approvedCount}`} 
            size="small" 
            color="success" 
            variant={approvedCount > 0 ? 'filled' : 'outlined'}
          />
          <Chip 
            icon={<RejectIcon />} 
            label={`Rejected: ${rejectedCount}`} 
            size="small" 
            color="error" 
            variant={rejectedCount > 0 ? 'filled' : 'outlined'}
          />
          <Chip 
            icon={<WarningIcon />} 
            label={`Pending: ${pendingCount}`} 
            size="small" 
            color="warning" 
            variant={pendingCount > 0 ? 'filled' : 'outlined'}
          />
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> These mappings have confidence scores below the configured threshold.
            Please review and approve or reject each mapping before the pipeline can continue.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Collapse in={expanded}>
          {/* Bulk Actions */}
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<ApproveAllIcon />}
              onClick={handleApproveAll}
            >
              Approve All
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<RejectAllIcon />}
              onClick={handleRejectAll}
            >
              Reject All
            </Button>
            {selectedIds.size > 0 && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={handleApproveSelected}
                >
                  Approve Selected ({selectedIds.size})
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={handleRejectSelected}
                >
                  Reject Selected ({selectedIds.size})
                </Button>
              </>
            )}
          </Box>

          {/* Mappings Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.size > 0 && selectedIds.size < localMappings.length}
                      checked={selectedIds.size === localMappings.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell><strong>Source</strong></TableCell>
                  <TableCell><strong>Target</strong></TableCell>
                  <TableCell align="center"><strong>Confidence</strong></TableCell>
                  <TableCell><strong>Rationale</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {localMappings.map((mapping) => (
                  <TableRow
                    key={mapping.mapping_id}
                    sx={{
                      bgcolor:
                        mapping.status === 'approved' ? 'success.50' :
                        mapping.status === 'rejected' ? 'error.50' :
                        'inherit'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(mapping.mapping_id)}
                        onChange={() => handleToggleSelect(mapping.mapping_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {mapping.source_table}.{mapping.source_column.split('.').pop()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {mapping.target_table}.{mapping.target_column.split('.').pop()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={formatConfidence(mapping.confidence)}
                        size="small"
                        color={getConfidenceColor(mapping.confidence)}
                      />
                    </TableCell>
                    <TableCell>
                      <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                        <AccordionSummary 
                          expandIcon={<ExpandIcon />} 
                          sx={{ 
                            minHeight: 32, 
                            py: 0,
                            '& .MuiAccordionSummary-content': { 
                              margin: '4px 0',
                              overflow: 'hidden'
                            }
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: 200,
                            }}
                          >
                            {mapping.rationale || 'No rationale provided'}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 1, pb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>LLM Rationale:</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                            {mapping.rationale || 'No rationale provided by the LLM for this mapping.'}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                    <TableCell align="center">
                      {mapping.status === 'approved' && (
                        <Chip label="Approved" size="small" color="success" />
                      )}
                      {mapping.status === 'rejected' && (
                        <Chip label="Rejected" size="small" color="error" />
                      )}
                      {mapping.status === 'pending' && (
                        <Chip label="Pending" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(mapping.mapping_id)}
                            disabled={mapping.status === 'approved'}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReject(mapping.mapping_id)}
                            disabled={mapping.status === 'rejected'}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>

        {/* Submit Button */}
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
            disabled={submitting || !allReviewed}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ApproveIcon />}
            sx={{ minWidth: 200 }}
          >
            {submitting ? 'Submitting...' : allReviewed ? 'Submit Decisions' : `Review ${pendingCount} Pending`}
          </Button>
        </Box>

        {!allReviewed && (
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
            Please approve or reject all pending mappings before submitting
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default HITLApprovalCard;

