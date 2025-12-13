/**
 * Projects Routes
 * Project management endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import { ProjectStatus, MilestoneStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { projectService } from '../services/projects/ProjectService';

const router = Router();

router.use(authenticate);

// Validation schemas
const createProjectSchema = z.object({
  leadId: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  street: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  startDate: z.string().datetime().optional(),
  estimatedDays: z.number().min(1).optional(),
  estimatedBudget: z.number().min(0).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  estimatedDays: z.number().min(1).optional(),
  estimatedBudget: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  portalEnabled: z.boolean().optional(),
});

const projectsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().optional(),
});

const createMilestoneSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  orderNum: z.number().optional(),
});

const updateMilestoneSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(MilestoneStatus).optional(),
  orderNum: z.number().optional(),
});

// GET /api/projects
router.get('/', validateQuery(projectsQuerySchema), asyncHandler(async (req, res) => {
  const result = await projectService.getProjects(req.user!.userId, req.query as any);
  const response = { 
    success: true, 
    data: result.projects,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
  res.json(response);
}));

// GET /api/projects/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await projectService.getProjectStats(req.user!.userId);
  res.json({ success: true, data: stats });
}));

// GET /api/projects/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.params.id, req.user!.userId);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  res.json({ success: true, data: project });
}));

// POST /api/projects
router.post('/', validateBody(createProjectSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.startDate) data.startDate = new Date(data.startDate);
  
  const project = await projectService.createProject({
    userId: req.user!.userId,
    ...data,
  });
  res.status(201).json({ success: true, data: project });
}));

// PUT /api/projects/:id
router.put('/:id', validateBody(updateProjectSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  
  const project = await projectService.updateProject(req.params.id, req.user!.userId, data);
  res.json({ success: true, data: project });
}));

// DELETE /api/projects/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Project deleted' });
}));

// === Milestones ===

// POST /api/projects/:id/milestones
router.post('/:id/milestones', validateBody(createMilestoneSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body, projectId: req.params.id };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  
  const milestone = await projectService.createMilestone(req.user!.userId, data);
  res.status(201).json({ success: true, data: milestone });
}));

// PUT /api/projects/:projectId/milestones/:milestoneId
router.put('/:projectId/milestones/:milestoneId', validateBody(updateMilestoneSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  
  const milestone = await projectService.updateMilestone(req.params.milestoneId, req.user!.userId, data);
  res.json({ success: true, data: milestone });
}));

// DELETE /api/projects/:projectId/milestones/:milestoneId
router.delete('/:projectId/milestones/:milestoneId', asyncHandler(async (req, res) => {
  await projectService.deleteMilestone(req.params.milestoneId, req.user!.userId);
  res.json({ success: true, message: 'Milestone deleted' });
}));

// === Photos ===

// POST /api/projects/:id/photos
router.post('/:id/photos', validateBody(z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  isPublic: z.boolean().default(true),
})), asyncHandler(async (req, res) => {
  const photo = await projectService.addPhoto(req.params.id, req.user!.userId, req.body);
  res.status(201).json({ success: true, data: photo });
}));

// DELETE /api/projects/:projectId/photos/:photoId
router.delete('/:projectId/photos/:photoId', asyncHandler(async (req, res) => {
  await projectService.deletePhoto(req.params.photoId, req.user!.userId);
  res.json({ success: true, message: 'Photo deleted' });
}));

export default router;
