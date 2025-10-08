import { useState } from 'react';
import type { Profile } from '../../../shared/types';

interface ProfilesSectionProps {
  config: any;
  toast: any;
}
 
export function ProfilesSection({ config, toast }: ProfilesSectionProps) {
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);

  const profiles = config.config?.profiles || [];
  const currentConfig = config.config;

  const handleSaveAsProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setSaving(true);

    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name: profileName,
      createdAt: Date.now(),
      ai: currentConfig?.ai,
      tts: currentConfig?.tts,
      appearance: currentConfig?.appearance,
    };

    const result = await config.saveProfile(newProfile);

    if (result.success) {
      toast.success(`Profile "${profileName}" saved`);
      setProfileName('');
    } else {
      toast.error(result.error || 'Failed to save profile');
    }

    setSaving(false);
  };

  const handleApplyProfile = async (profile: Profile) => {
    const result = await config.applyProfile(profile.id);

    if (result.success) {
      toast.success(`Applied profile "${profile.name}"`);
    } else {
      toast.error(result.error || 'Failed to apply profile');
    }
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (!confirm(`Delete profile "${profile.name}"?`)) return;

    const result = await config.deleteProfile(profile.id);

    if (result.success) {
      toast.success(`Deleted profile "${profile.name}"`);
    } else {
      toast.error(result.error || 'Failed to delete profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Current as Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Save Current Configuration</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Profile name"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveAsProfile()}
          />
          <button
            onClick={handleSaveAsProfile}
            disabled={saving || !profileName.trim()}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save as Profile'}
          </button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Saved Profiles</h3>

        {profiles.length === 0 ? (
          <p className="text-gray-500 text-sm">No profiles saved yet</p>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile: Profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div>
                  <h4 className="font-medium">{profile.name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyProfile(profile)}
                    className="px-3 py-1 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
