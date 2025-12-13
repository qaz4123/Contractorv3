/**
 * Routes Index
 * Combines all route modules
 */

import { Router } from 'express';
import authRoutes from './auth';
import leadsRoutes from './leads';
import tasksRoutes from './tasks';
import quotesRoutes from './quotes';
import projectsRoutes from './projects';
import invoicesRoutes from './invoices';
import subcontractorsRoutes from './subcontractors';
import financingRoutes from './financing';
import analyticsRoutes from './analytics';
import automationRoutes from './automation';
import notificationsRoutes from './notifications';
import jobsRoutes from './jobs';
import materialsRoutes from './materials';
import usageRoutes from './usage';
import workflowRoutes from './workflow';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/quotes', quotesRoutes);
router.use('/projects', projectsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/subcontractors', subcontractorsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/financing', financingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/automation', automationRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/materials', materialsRoutes);
router.use('/usage', usageRoutes);
router.use('/workflow', workflowRoutes);

export default router;
