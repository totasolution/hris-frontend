import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import type { Permission, Role } from '../services/api';
import * as api from '../services/api';

export default function RolePermissionsPage() {
  const { id } = useParams<{ id: string }>();
  const roleId = id ? parseInt(id, 10) : 0;
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!roleId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [r, perms, ids] = await Promise.all([
          api.getRole(roleId),
          api.getPermissions(),
          api.getRolePermissionIds(roleId),
        ]);
        setRole(r);
        setPermissions(perms);
        setSelectedIds(new Set(ids));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [roleId]);

  const toggle = (permId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const toggleSection = (resource: string, perms: Permission[]) => {
    const permIds = perms.map((p) => p.id);
    const allSelected = permIds.every((id) => selectedIds.has(id));
    
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all in this section
        permIds.forEach((id) => next.delete(id));
      } else {
        // Select all in this section
        permIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const isSectionAllSelected = (perms: Permission[]) => {
    return perms.length > 0 && perms.every((p) => selectedIds.has(p.id));
  };

  const isSectionIndeterminate = (perms: Permission[]) => {
    const selectedCount = perms.filter((p) => selectedIds.has(p.id)).length;
    return selectedCount > 0 && selectedCount < perms.length;
  };

  const handleSave = async () => {
    if (!roleId) return;
    setSaving(true);
    setError(null);
    try {
      await api.setRolePermissions(roleId, Array.from(selectedIds));
      toast.success('Permissions saved successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !role) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  );

  const byResource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={`Role: ${role.name}`}
        subtitle="Configure granular access permissions"
        actions={
          <div className="flex items-center gap-4">
            <Link
              to="/roles"
              className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Back to Roles
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(byResource).sort(([a], [b]) => a.localeCompare(b)).map(([resource, perms]) => (
          <Card key={resource} className="h-full">
            <CardBody className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer group border-b border-brand/10 pb-3">
                <input
                  type="checkbox"
                  checked={isSectionAllSelected(perms)}
                  ref={(input) => {
                    if (input) input.indeterminate = isSectionIndeterminate(perms);
                  }}
                  onChange={() => toggleSection(resource, perms)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
                />
                <h3 className="text-xs font-bold text-brand uppercase tracking-[0.2em] capitalize group-hover:text-brand-dark transition-colors">
                  {resource.replace(/:/g, ' ')}
                </h3>
              </label>
              <div className="space-y-2">
                {perms.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-light transition-all cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand transition-colors capitalize">
                        {p.action.replace(/_/g, ' ')}
                      </span>
                      {p.description && <span className="text-[10px] text-slate-400">{p.description}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
