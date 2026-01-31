'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui';
import { Button } from '@repo/ui';
import { IconRefresh, IconCheck, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import { useToast } from '@repo/ui/hooks/use-toast';
import {
  getConnections,
  syncVercelSites,
  getPlatformIcon,
  getPlatformName,
  type PlatformConnection,
} from '../../lib/services/deployment-service';

export function SyncSitesDialog() {
  const [open, setOpen] = useState(false);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchConnections();
    }
  }, [open]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await getConnections();
      if (response.success && response.data) {
        setConnections(response.data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (connectionId: string, platformName: string) => {
    try {
      setSyncing(connectionId);
      const response = await syncVercelSites(connectionId);
      
      if (response && 'synced' in response) {
        toast({
          title: 'Sync Complete',
          description: `Successfully synced ${response.synced || 0} sites from ${platformName}`,
        });
        // Close dialog and refresh page
        setOpen(false);
        window.location.reload();
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync sites',
        });
      }
    } catch (error) {
      console.error('Error syncing sites:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconRefresh className="h-4 w-4 mr-2" />
          Sync Sites
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sync Sites from Platform</DialogTitle>
          <DialogDescription>
            Import your projects from connected deployment platforms
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <IconAlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
              <p className="text-neutral-400 mb-4">No platforms connected</p>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Connect a Platform
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getPlatformIcon(connection.platform)}</div>
                    <div>
                      <div className="font-medium text-white">
                        {getPlatformName(connection.platform)}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {connection.platformName}
                      </div>
                      {connection.sitesCount !== undefined && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {connection.sitesCount} sites
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSync(connection.id, getPlatformName(connection.platform))}
                    disabled={syncing !== null}
                  >
                    {syncing === connection.id ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <IconRefresh className="h-4 w-4 mr-2" />
                        Sync
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
