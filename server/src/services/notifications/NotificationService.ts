/**
 * Notification Service
 * Handles SMS, email, and in-app notifications
 * Placeholders for Twilio (SMS) and SendGrid (Email)
 */

import { NotificationType, ReminderType } from '@prisma/client';
import prisma from '../../lib/prisma';

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels?: ('email' | 'sms' | 'push')[];
}

export interface SendReminderInput {
  userId: string;
  taskId?: string;
  leadId?: string;
  title: string;
  message: string;
  reminderType: ReminderType;
}

export class NotificationService {
  // Placeholder: Would be initialized with actual API keys
  private twilioEnabled = false;
  private sendgridEnabled = false;

  constructor() {
    // Check if SMS/Email services are configured
    this.twilioEnabled = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    this.sendgridEnabled = !!process.env.SENDGRID_API_KEY;

    if (!this.twilioEnabled) {
      console.log('📱 Twilio not configured - SMS notifications disabled');
    }
    if (!this.sendgridEnabled) {
      console.log('📧 SendGrid not configured - Email notifications disabled');
    }
  }

  /**
   * Send a notification
   */
  async sendNotification(input: SendNotificationInput) {
    const { userId, type, title, message, data, channels = ['push'] } = input;

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phone: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const sentVia: string[] = [];

    // Send via each channel
    if (channels.includes('email') && user.emailNotifications && user.email) {
      await this.sendEmail(user.email, title, message);
      sentVia.push('email');
    }

    if (channels.includes('sms') && user.smsNotifications && user.phone) {
      await this.sendSMS(user.phone, message);
      sentVia.push('sms');
    }

    // Always create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        sentVia,
      },
    });

    return notification;
  }

  /**
   * Send reminder for a task
   */
  async sendTaskReminder(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true,
        lead: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const channels: ('email' | 'sms' | 'push')[] = ['push'];
    if (task.reminderType === 'EMAIL' || task.reminderType === 'BOTH') {
      channels.push('email');
    }
    if (task.reminderType === 'SMS' || task.reminderType === 'BOTH') {
      channels.push('sms');
    }

    const leadInfo = task.lead ? ` for ${task.lead.name}` : '';

    await this.sendNotification({
      userId: task.userId,
      type: 'TASK_REMINDER',
      title: 'Task Reminder',
      message: `Reminder: ${task.title}${leadInfo}`,
      data: { taskId: task.id, leadId: task.leadId },
      channels,
    });

    // Mark reminder as sent
    await prisma.task.update({
      where: { id: taskId },
      data: { reminderSent: true },
    });
  }

  /**
   * Send email (placeholder - integrate with SendGrid)
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.sendgridEnabled) {
      console.log(`📧 [Email Placeholder] To: ${to}, Subject: ${subject}`);
      return true;
    }

    try {
      // TODO: Integrate with SendGrid
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to,
      //   from: process.env.SENDGRID_FROM_EMAIL,
      //   subject,
      //   text: body,
      //   html: `<p>${body}</p>`,
      // });

      console.log(`📧 [SendGrid] Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Send SMS (placeholder - integrate with Twilio)
   */
  private async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.twilioEnabled) {
      console.log(`📱 [SMS Placeholder] To: ${to}, Message: ${message}`);
      return true;
    }

    try {
      // TODO: Integrate with Twilio
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to,
      // });

      console.log(`📱 [Twilio] SMS sent to ${to}`);
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}
  ) {
    const { unreadOnly = false, page = 1, pageSize = 20 } = options;

    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  /**
   * Process pending reminders (would be called by a cron job)
   */
  async processPendingReminders() {
    const now = new Date();

    const pendingTasks = await prisma.task.findMany({
      where: {
        reminderAt: { lte: now },
        reminderSent: false,
        status: { not: 'COMPLETED' },
      },
      take: 100,
    });

    console.log(`Processing ${pendingTasks.length} pending reminders`);

    for (const task of pendingTasks) {
      try {
        await this.sendTaskReminder(task.id);
      } catch (error) {
        console.error(`Failed to send reminder for task ${task.id}:`, error);
      }
    }

    return pendingTasks.length;
  }

  /**
   * Send quote notification
   */
  async sendQuoteNotification(quoteId: string, action: 'sent' | 'accepted' | 'rejected') {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { user: true, lead: true },
    });

    if (!quote) return;

    const messages = {
      sent: `Your quote "${quote.title}" has been sent to ${quote.lead?.name || 'client'}`,
      accepted: `Great news! Your quote "${quote.title}" was accepted!`,
      rejected: `Your quote "${quote.title}" was declined`,
    };

    await this.sendNotification({
      userId: quote.userId,
      type: 'QUOTE_ACCEPTED',
      title: `Quote ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: messages[action],
      data: { quoteId },
      channels: ['push', 'email'],
    });
  }

  /**
   * Send payment received notification
   */
  async sendPaymentNotification(invoiceId: string, amount: number) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    });

    if (!invoice) return;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    await this.sendNotification({
      userId: invoice.userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `You received a payment of ${formattedAmount} for invoice ${invoice.invoiceNumber}`,
      data: { invoiceId, amount },
      channels: ['push', 'email'],
    });
  }
}

export const notificationService = new NotificationService();
