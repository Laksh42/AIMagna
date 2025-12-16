// Minimal Landing Page Component

import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { RocketLaunch as PipelineIcon } from '@mui/icons-material';

interface LandingPageProps {
  onStartPipeline: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartPipeline }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: 'center',
          maxWidth: 600,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          AIMagna ETL
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 4, lineHeight: 1.6 }}
        >
          Intelligent data transformation pipeline with AI-powered mapping,
          automated ETL workflows, and human-in-the-loop validation.
        </Typography>

        <Button
          variant="contained"
          size="large"
          color="primary"
          startIcon={<PipelineIcon />}
          onClick={onStartPipeline}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
            },
          }}
        >
          Start Pipeline
        </Button>
      </Paper>
    </Box>
  );
};
