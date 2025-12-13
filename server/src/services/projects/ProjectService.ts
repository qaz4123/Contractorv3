/**
 * Project Service
 * Handles project management, milestones, photos, and client portal
 */

import { ProjectStatus, MilestoneStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import prisma from '../../lib/prisma';

export interface CreateProjectInput {
  userId: string;
  leadId?: string;
  name: string;
  description?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  startDate?: Date;
  estimatedDays?: number;
  estimatedBudget?: number;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  estimatedDays?: number;
  estimatedBudget?: number;
  actualCost?: number;
  portalEnabled?: boolean;
}

export interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description?: string;
  dueDate?: Date;
  orderNum?: number;
}

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        userId: input.userId,
        leadId: input.leadId,
        name: input.name,
        description: input.description,
        street: input.street,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        status: 'PLANNING',
        startDate: input.startDate,
        estimatedDays: input.estimatedDays,
        estimatedBudget: input.estimatedBudget,
      },
      include: {
        lead: true,
        milestones: true,
      },
    });

    return project;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string, userId: string) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        lead: true,
        milestones: {
          orderBy: { orderNum: 'asc' },
        },
        photos: {
          orderBy: { takenAt: 'desc' },
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
          take: 5,
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get all projects for a user
   */
  async getProjects(
    userId: string,
    options: {
      status?: ProjectStatus;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const { status, search, page = 1, pageSize = 20 } = options;

    const where: any = { userId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { street: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          milestones: {
            orderBy: { orderNum: 'asc' },
          },
          _count: {
            select: {
              photos: true,
              tasks: true,
              invoices: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!existing) {
      throw new Error('Project not found');
    }

    // Generate portal token if enabling portal
    const updateData: any = { ...input };
    if (input.portalEnabled && !existing.portalToken) {
      updateData.portalToken = crypto.randomBytes(32).toString('hex');
    }

    return prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        milestones: true,
        photos: true,
      },
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    await prisma.project.delete({ where: { id: projectId } });
    return true;
  }

  /**
   * Create a milestone
   */
  async createMilestone(userId: string, input: CreateMilestoneInput) {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, userId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get next order number if not provided
    let orderNum = input.orderNum;
    if (orderNum === undefined) {
      const lastMilestone = await prisma.milestone.findFirst({
        where: { projectId: input.projectId },
        orderBy: { orderNum: 'desc' },
      });
      orderNum = (lastMilestone?.orderNum || 0) + 1;
    }

    return prisma.milestone.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        dueDate: input.dueDate,
        orderNum,
        status: 'PENDING',
      },
    });
  }

  /**
   * Update a milestone
   */
  async updateMilestone(
    milestoneId: string,
    userId: string,
    input: {
      name?: string;
      description?: string;
      dueDate?: Date;
      status?: MilestoneStatus;
      orderNum?: number;
    }
  ) {
    // Verify ownership
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone || milestone.project.userId !== userId) {
      throw new Error('Milestone not found');
    }

    const updateData: any = { ...input };
    if (input.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(milestoneId: string, userId: string) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone || milestone.project.userId !== userId) {
      throw new Error('Milestone not found');
    }

    await prisma.milestone.delete({ where: { id: milestoneId } });
    return true;
  }

  /**
   * Add a photo to project
   */
  async addPhoto(
    projectId: string,
    userId: string,
    input: { url: string; caption?: string; isPublic?: boolean }
  ) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return prisma.projectPhoto.create({
      data: {
        projectId,
        url: input.url,
        caption: input.caption,
        isPublic: input.isPublic ?? true,
      },
    });
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string, userId: string) {
    const photo = await prisma.projectPhoto.findFirst({
      where: { id: photoId },
      include: { project: true },
    });

    if (!photo || photo.project.userId !== userId) {
      throw new Error('Photo not found');
    }

    await prisma.projectPhoto.delete({ where: { id: photoId } });
    return true;
  }

  /**
   * Get project by portal token (for client access)
   */
  async getProjectByPortalToken(token: string) {
    const project = await prisma.project.findFirst({
      where: {
        portalToken: token,
        portalEnabled: true,
      },
      include: {
        milestones: {
          orderBy: { orderNum: 'asc' },
        },
        photos: {
          where: { isPublic: true },
          orderBy: { takenAt: 'desc' },
        },
        invoices: {
          where: { status: { in: ['SENT', 'VIEWED', 'PARTIAL', 'PAID'] } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or portal not enabled');
    }

    // Remove sensitive data
    const { userId, ...publicProject } = project;
    return publicProject;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(userId: string) {
    const [total, byStatus, recentProjects, financials] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          street: true,
          city: true,
          updatedAt: true,
        },
      }),
      prisma.project.aggregate({
        where: { userId },
        _sum: {
          estimatedBudget: true,
          actualCost: true,
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    );

    return {
      total,
      byStatus: statusCounts,
      totalEstimatedBudget: financials._sum.estimatedBudget || 0,
      totalActualCost: financials._sum.actualCost || 0,
      recentProjects,
    };
  }
}

export const projectService = new ProjectService();
