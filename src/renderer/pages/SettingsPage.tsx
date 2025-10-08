import { SettingsRoot } from '../components/settings/SettingsRoot';

export function SettingsPage() {
  return (
    <div className="w-screen h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <SettingsRoot onClose={() => window.close()} standalone={true} />
    </div>
  );
}
