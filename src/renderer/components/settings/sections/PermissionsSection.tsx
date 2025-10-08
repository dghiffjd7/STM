import { useState } from 'react';

interface PermissionsSectionProps {
  config: any;
  toast: any;
}

export function PermissionsSection({ config, toast }: PermissionsSectionProps) {
  const [newAllowPath, setNewAllowPath] = useState('');
  const [newDenyPath, setNewDenyPath] = useState('');

  const permissions = config.config?.permissions;
  const allowPaths = permissions?.allowPaths || [];
  const denyPaths = permissions?.denyPaths || [];

  const handleUpdate = async (field: string, value: any) => {
    const result = await config.update({
      permissions: {
        ...permissions,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success('Permissions updated');
    } else {
      toast.error(result.error || 'Failed to update permissions');
    }
  };

  const handleAddAllowPath = () => {
    if (!newAllowPath.trim()) return;

    handleUpdate('allowPaths', [...allowPaths, newAllowPath]);
    setNewAllowPath('');
  };

  const handleRemoveAllowPath = (index: number) => {
    handleUpdate(
      'allowPaths',
      allowPaths.filter((_: string, i: number) => i !== index)
    );
  };

  const handleAddDenyPath = () => {
    if (!newDenyPath.trim()) return;

    handleUpdate('denyPaths', [...denyPaths, newDenyPath]);
    setNewDenyPath('');
  };

  const handleRemoveDenyPath = (index: number) => {
    handleUpdate(
      'denyPaths',
      denyPaths.filter((_: string, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      {/* Allow Paths */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Allow Paths (Whitelist)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paths that STM is allowed to access
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={newAllowPath}
            onChange={(e) => setNewAllowPath(e.target.value)}
            placeholder="/path/to/allow"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAllowPath()}
          />
          <button
            onClick={handleAddAllowPath}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Add
          </button>
        </div>

        {allowPaths.length === 0 ? (
          <p className="text-sm text-gray-500">No allow paths configured</p>
        ) : (
          <div className="space-y-2">
            {allowPaths.map((path: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <code className="text-sm">{path}</code>
                <button
                  onClick={() => handleRemoveAllowPath(index)}
                  className="px-2 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deny Paths */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Deny Paths (Blacklist)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paths that STM is explicitly denied from accessing
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDenyPath}
            onChange={(e) => setNewDenyPath(e.target.value)}
            placeholder="/path/to/deny"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleAddDenyPath()}
          />
          <button
            onClick={handleAddDenyPath}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Add
          </button>
        </div>

        {denyPaths.length === 0 ? (
          <p className="text-sm text-gray-500">No deny paths configured</p>
        ) : (
          <div className="space-y-2">
            {denyPaths.map((path: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <code className="text-sm">{path}</code>
                <button
                  onClick={() => handleRemoveDenyPath(index)}
                  className="px-2 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Security Settings</h3>

        {/* Confirm Destructive (Always True) */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Confirm Destructive Operations</label>
            <p className="text-xs text-gray-500">Always enabled for safety</p>
          </div>
          <button
            disabled
            className="relative w-12 h-6 rounded-full bg-pink-500 opacity-50 cursor-not-allowed"
          >
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-6" />
          </button>
        </div>

        {/* Audit Directory */}
        <div>
          <label className="block text-sm font-medium mb-2">Audit Log Directory</label>
          <input
            type="text"
            value={permissions?.auditDir || ''}
            onChange={(e) => handleUpdate('auditDir', e.target.value)}
            placeholder="/path/to/logs"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Retention Days */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Log Retention (days): {permissions?.retentionDays || 30}
          </label>
          <input
            type="range"
            min="7"
            max="365"
            value={permissions?.retentionDays || 30}
            onChange={(e) => handleUpdate('retentionDays', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>7 days</span>
            <span>365 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
