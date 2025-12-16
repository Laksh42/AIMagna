// ETL Progress Card - Shows unified progress for all ETL steps

import React, { useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Loop as RunningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

interface ETLStep {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  progress?: number;
}

interface ETLProgressCardProps {
  runId: string;
  folderPath?: string;
  overallProgress: number;
  currentStep: string;
  status: string;
  steps: ETLStep[];
  error?: string;
  isHitlWaiting?: boolean; // Indicates if HITL approval is waiting
  mappings?: any[]; // Mappings data for dropdown
  transformations?: any[]; // Transformations data for dropdown
}

const ETL_STEPS = [
  { name: 'download', label: 'Download from GCS' },
  { name: 'profiler', label: 'Data Profiling' },
  { name: 'staging', label: 'Staging to BigQuery' },
  { name: 'mapper', label: 'Schema Mapping' },
  { name: 'hitl', label: 'Human Approval' },
  { name: 'create_tables', label: 'Create Target Tables' },
  { name: 'transform', label: 'Generate Transforms' },
  { name: 'execute', label: 'Execute Transforms' },
  { name: 'validator', label: 'Data Validation' },
  { name: 'feedback', label: 'Capture Feedback' },
  { name: 'cleanup', label: 'Cleanup' },
];

export const ETLProgressCard: React.FC<ETLProgressCardProps> = ({
  runId,
  folderPath,
  overallProgress,
  currentStep,
  status,
  steps,
  error,
  isHitlWaiting = false,
  mappings = [],
  transformations = [],
}) => {
  // Keep steps collapsed by default for cleaner UI
  const [expanded, setExpanded] = React.useState(false);

  // Track the maximum progress to prevent backwards movement
  const maxProgressRef = useRef(0);
  
  // Calculate smooth progress - only increase, never decrease
  const smoothProgress = React.useMemo(() => {
    const newProgress = Math.max(0, Math.min(100, overallProgress || 0));
    if (newProgress > maxProgressRef.current) {
      maxProgressRef.current = newProgress;
    }
    return maxProgressRef.current;
  }, [overallProgress]);
  
  // Reset max progress when run changes
  useEffect(() => {
    maxProgressRef.current = 0;
  }, [runId]);

  const getStepStatus = (stepName: string): 'pending' | 'running' | 'completed' | 'error' => {
    const step = steps.find(s => s.name === stepName);
    if (step) return step.status;
    
    // Infer status from current step
    const stepIndex = ETL_STEPS.findIndex(s => s.name === stepName);
    const currentIndex = ETL_STEPS.findIndex(s => s.name === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return status === 'failed' ? 'error' : 'running';
    return 'pending';
  };

  const getStepMessage = (stepName: string): string | undefined => {
    const step = steps.find(s => s.name === stepName);
    return step?.message;
  };

  const getStepIcon = (stepStatus: 'pending' | 'running' | 'completed' | 'error') => {
    switch (stepStatus) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'running':
        return <RunningIcon color="primary" sx={{ animation: 'spin 1s linear infinite' }} />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const isComplete = status === 'completed' || status === 'success';
  const isFailed = status === 'failed' || status === 'error';
  
  // Get current stage name
  const getCurrentStageName = (): string => {
    const step = ETL_STEPS.find(s => s.name === currentStep);
    return step ? step.label : currentStep;
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: 2, 
        borderColor: isComplete ? 'success.main' : isFailed ? 'error.main' : isHitlWaiting ? 'warning.main' : 'primary.main',
        bgcolor: isComplete ? 'success.50' : isFailed ? 'error.50' : isHitlWaiting ? 'warning.50' : 'background.paper',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight="bold">
              🚀 ETL Pipeline
            </Typography>
            <Chip 
              label={
                isComplete ? 'Completed' : 
                isFailed ? 'Failed' : 
                isHitlWaiting ? 'Waiting' : 
                'Running'
              } 
              size="small"
              color={
                isComplete ? 'success' : 
                isFailed ? 'error' : 
                isHitlWaiting ? 'warning' : 
                'primary'
              }
              sx={isHitlWaiting ? { bgcolor: '#f57c00', color: 'white' } : {}}
            />
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Box>

        {/* Run Info */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip label={`Run: ${runId}`} size="small" variant="outlined" />
          {folderPath && <Chip label={`📁 ${folderPath}`} size="small" variant="outlined" />}
        </Box>

        {/* Overall Progress */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight="medium">
              <strong>{getCurrentStageName()}</strong> - Overall Progress
            </Typography>
            <Typography variant="body2" color="primary">
              {smoothProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={smoothProgress} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: isComplete ? 'success.main' : isFailed ? 'error.main' : 'primary.main',
                transition: 'transform 0.5s ease-in-out',
              }
            }}
          />
        </Box>

        {/* Error Display */}
        {error && (
          <Box sx={{ bgcolor: 'error.100', p: 1.5, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" color="error.dark">
              <strong>Error:</strong> {error}
            </Typography>
          </Box>
        )}

        {/* Steps */}
        <Collapse in={expanded}>
          <Stepper orientation="vertical" activeStep={-1}>
            {ETL_STEPS.map((step) => {
              const stepStatus = getStepStatus(step.name);
              const message = getStepMessage(step.name);
              const isMapperStep = step.name === 'mapper' && isComplete && mappings.length > 0;
              const isTransformStep = step.name === 'transform' && isComplete && transformations.length > 0;

              return (
                <Step key={step.name} completed={stepStatus === 'completed'}>
                  <StepLabel
                    StepIconComponent={() => getStepIcon(stepStatus)}
                    optional={
                      message && stepStatus !== 'pending' ? (
                        <Typography variant="caption" color="text.secondary">
                          {message}
                        </Typography>
                      ) : null
                    }
                  >
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography
                        variant="body2"
                        color={
                          stepStatus === 'running' ? 'primary.main' :
                          stepStatus === 'completed' ? 'success.main' :
                          stepStatus === 'error' ? 'error.main' : 'text.secondary'
                        }
                        fontWeight={stepStatus === 'running' ? 'bold' : 'normal'}
                      >
                        {step.label}
                      </Typography>
                      
                      {/* Dropdown for Mappings */}
                      {isMapperStep && (
                        <Accordion sx={{ width: '100%', boxShadow: 'none', mt: 1 }}>
                          <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 32, py: 0 }}>
                            <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <InfoIcon fontSize="small" />
                              View {mappings.length} Mapping(s)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 1, pb: 1 }}>
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                              {mappings.map((mapping: any, idx: number) => (
                                <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                  <Typography variant="caption" fontFamily="monospace" display="block">
                                    <strong>Source:</strong> {mapping.source_table}.{mapping.source_column?.split('.').pop()}
                                  </Typography>
                                  <Typography variant="caption" fontFamily="monospace" display="block">
                                    <strong>Target:</strong> {mapping.target_table}.{mapping.target_column?.split('.').pop()}
                                  </Typography>
                                  {mapping.confidence && (
                                    <Chip 
                                      label={`${(mapping.confidence * 100).toFixed(1)}%`} 
                                      size="small" 
                                      sx={{ mt: 0.5 }}
                                      color={mapping.confidence >= 0.95 ? 'success' : mapping.confidence >= 0.9 ? 'warning' : 'error'}
                                    />
                                  )}
                                </Box>
                              ))}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      )}
                      
                      {/* Dropdown for Transformations */}
                      {isTransformStep && (
                        <Accordion sx={{ width: '100%', boxShadow: 'none', mt: 1 }}>
                          <AccordionSummary expandIcon={<ExpandIcon />} sx={{ minHeight: 32, py: 0 }}>
                            <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <InfoIcon fontSize="small" />
                              View {transformations.length} Transformation(s)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 1, pb: 1 }}>
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                              {transformations.map((transform: any, idx: number) => (
                                <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                  <Typography variant="caption" fontFamily="monospace" display="block" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {transform.sql || transform.query || JSON.stringify(transform, null, 2)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Collapse>

        {/* Completion Message */}
        {isComplete && (
          <Box sx={{ bgcolor: 'success.100', p: 2, borderRadius: 1, mt: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="success.dark" fontWeight="bold">
              ✅ ETL Pipeline completed successfully!
            </Typography>
            <Typography variant="body2" color="success.dark">
              You can now query your transformed data below.
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
};

