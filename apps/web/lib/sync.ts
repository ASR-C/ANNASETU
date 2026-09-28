/**
 * ANNASETU Universal Real-Time Cross-Window Synchronizer
 * Enables instantaneous zero-latency updates across all open tabs, windows, and role portals.
 */

export type SyncEventType =
  | 'DONATION_POSTED'
  | 'NEED_POSTED'
  | 'JOB_RESERVED'
  | 'JOB_ACCEPTED'
  | 'JOB_PICKED_UP'
  | 'JOB_DELIVERED'
  | 'QUOTA_CLAIMED'
  | 'FORCE_REFRESH';

export interface SyncMessage {
  type: SyncEventType;
  payload?: any;
  senderRole?: string;
  timestamp: number;
}

const CHANNEL_NAME = 'annasetu_live_sync_channel';
const STORAGE_KEY = 'annasetu_sync_beacon';

class LiveSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: SyncMessage) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data) {
              this.notifyListeners(event.data);
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted, falling back to storage events');
      }

      // Fallback cross-window listener using storage events
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const data: SyncMessage = JSON.parse(event.newValue);
            this.notifyListeners(data);
          } catch (_) {}
        }
      });
    }
  }

  public broadcast(type: SyncEventType, payload?: any, senderRole?: string) {
    const message: SyncMessage = {
      type,
      payload,
      senderRole,
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel (0ms cross-tab latency)
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    // 2. Storage event beacon (cross-window fallback)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
      } catch (_) {}

      // 3. Same-window internal dispatch
      window.dispatchEvent(new CustomEvent('annasetu_internal_sync', { detail: message }));
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.add(callback);

    let internalHandler: any = null;
    if (typeof window !== 'undefined') {
      internalHandler = (e: any) => {
        if (e.detail) callback(e.detail);
      };
      window.addEventListener('annasetu_internal_sync', internalHandler);
    }

    return () => {
      this.listeners.delete(callback);
      if (typeof window !== 'undefined' && internalHandler) {
        window.removeEventListener('annasetu_internal_sync', internalHandler);
      }
    };
  }

  private notifyListeners(message: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }
}

export const liveSync = new LiveSyncManager();
