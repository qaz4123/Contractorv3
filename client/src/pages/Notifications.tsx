import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_COLORS: Record<Notification['type'], string> = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'danger',
};

const TYPE_ICONS: Record<Notification['type'], string> = {
  INFO: 'ℹ️',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
};

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-sm rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Stay updated with your latest activities
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-gray-600">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-2">
              You'll see notifications here when you have updates
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${
                notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{TYPE_ICONS[notification.type]}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                    <Badge variant={TYPE_COLORS[notification.type] as any}>
                      {notification.type}
                    </Badge>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{notification.message}</p>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(notification.id)}
                        disabled={markReadMutation.isPending}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this notification?')) {
                          deleteMutation.mutate(notification.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};
