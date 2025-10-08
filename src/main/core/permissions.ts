import Store from 'electron-store';
import { PermissionDomain, PermissionRule } from '../../shared/types';

interface PermissionStore {
  rules: PermissionRule[];
}

const store = new Store<PermissionStore>({
  name: 'permissions',
  defaults: {
    rules: [],
  },
});

export function checkPermission(domain: PermissionDomain, scope?: string): boolean {
  const rules = store.get('rules');

  // Find matching rule
  const rule = rules.find((r) => {
    if (r.domain !== domain) return false;
    if (!scope || !r.scope) return true;

    // Simple wildcard matching
    const pattern = r.scope.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(scope);
  });

  return rule?.allow ?? false;
}

export function grantPermission(
  domain: PermissionDomain,
  allow: boolean,
  scope?: string
): void {
  const rules = store.get('rules');

  // Remove existing rule for this domain+scope
  const filteredRules = rules.filter((r) => {
    if (r.domain !== domain) return true;
    if (!scope) return false;
    return r.scope !== scope;
  });

  // Add new rule
  filteredRules.push({
    domain,
    allow,
    scope,
    timestamp: Date.now(),
  });

  store.set('rules', filteredRules);
}

export function revokePermission(domain: PermissionDomain, scope?: string): void {
  const rules = store.get('rules');

  const filteredRules = rules.filter((r) => {
    if (r.domain !== domain) return true;
    if (!scope) return false;
    return r.scope !== scope;
  });

  store.set('rules', filteredRules);
}

export function listPermissions(): PermissionRule[] {
  return store.get('rules');
}
