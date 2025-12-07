import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Bell, Palette, Save } from 'lucide-react';
import { Button, Card, Input } from '../components';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';

export function Settings() {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) => authService.updateProfile(data),
    onSuccess: (response) => {
      setAuth(response.user, localStorage.getItem('token') || '');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Sidebar */}
        <Card className="lg:w-64 shrink-0" padding="sm">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <Input
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="John Smith"
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="john@example.com"
                />
                <Input
                  label="Company Name"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  placeholder="ABC Construction"
                />
                <Input
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
                <Button type="submit" loading={updateProfileMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                {updateProfileMutation.isSuccess && (
                  <p className="text-sm text-green-600">Profile updated successfully!</p>
                )}
              </form>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                {passwordError && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
                <Button type="submit" loading={updatePasswordMutation.isPending}>
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
                {updatePasswordMutation.isSuccess && (
                  <p className="text-sm text-green-600">Password updated successfully!</p>
                )}
              </form>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-4 max-w-md">
                <NotificationToggle
                  label="Email Notifications"
                  description="Receive email updates about your leads and projects"
                  defaultChecked
                />
                <NotificationToggle
                  label="SMS Notifications"
                  description="Get text messages for urgent updates"
                />
                <NotificationToggle
                  label="Task Reminders"
                  description="Receive reminders for upcoming tasks"
                  defaultChecked
                />
                <NotificationToggle
                  label="Quote Updates"
                  description="Get notified when quotes are viewed or accepted"
                  defaultChecked
                />
                <NotificationToggle
                  label="Payment Notifications"
                  description="Receive alerts for new payments"
                  defaultChecked
                />
              </div>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6">Appearance</h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    <ThemeOption label="Light" value="light" />
                    <ThemeOption label="Dark" value="dark" />
                    <ThemeOption label="System" value="system" active />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <ColorOption color="bg-blue-600" active />
                    <ColorOption color="bg-green-600" />
                    <ColorOption color="bg-purple-600" />
                    <ColorOption color="bg-orange-600" />
                    <ColorOption color="bg-red-600" />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({ 
  label, 
  description, 
  defaultChecked = false 
}: { 
  label: string; 
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ThemeOption({ 
  label, 
  active = false 
}: { 
  label: string; 
  value: string;
  active?: boolean;
}) {
  return (
    <button
      className={`px-4 py-2 rounded-lg border transition-colors ${
        active
          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

function ColorOption({ color, active = false }: { color: string; active?: boolean }) {
  return (
    <button
      className={`w-8 h-8 rounded-full ${color} ${
        active ? 'ring-2 ring-offset-2 ring-gray-400' : ''
      }`}
    />
  );
}
