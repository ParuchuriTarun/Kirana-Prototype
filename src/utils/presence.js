import { supabase } from './supabase';

let activeChannel = null;

/**
 * Join the real-time presence channel and track user session safely
 */
export function trackPresence(sessionData, onSync) {
  if (typeof window === 'undefined') return () => {};

  try {
    const channelId = 'kirana_live_presence';

    // Check if channel already exists on the Supabase client
    const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
    const existing = existingChannels.find(
      (c) => c.topic === `realtime:${channelId}` || c.subTopic === channelId
    );

    // If channel is already joined or joining, reuse it and update presence without calling .on() again
    if (existing && (existing.state === 'joined' || existing.state === 'joining')) {
      activeChannel = existing;
      if (sessionData) {
        try {
          existing.track({
            ...sessionData,
            onlineAt: new Date().toISOString()
          }).catch(() => {});
        } catch (_) {}
      }
      return () => {
        try {
          existing.untrack().catch(() => {});
        } catch (_) {}
      };
    }

    // Otherwise, remove stale channel if it exists before creating a fresh one
    if (existing) {
      try {
        supabase.removeChannel(existing);
      } catch (_) {}
    }

    activeChannel = supabase.channel(channelId, {
      config: {
        presence: {
          key: sessionData?.sessionId || `anon-${Date.now()}`
        }
      }
    });

    activeChannel
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = activeChannel.presenceState();
          if (onSync) onSync(state);
        } catch (_) {}
      })
      .on('broadcast', { event: 'remote_logout' }, ({ payload }) => {
        try {
          if (!payload?.sessionId) return;
          if (
            payload.sessionId === sessionData?.sessionId ||
            payload.sessionId === sessionData?.email ||
            payload.sessionId === sessionData?.userId ||
            payload.sessionId === sessionData?.phone
          ) {
            window.dispatchEvent(new CustomEvent('kirana_remote_logout', { detail: payload }));
          }
        } catch (_) {}
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && sessionData) {
          try {
            await activeChannel.track({
              ...sessionData,
              onlineAt: new Date().toISOString()
            });
          } catch (_) {}
        }
      });

    return () => {
      try {
        if (activeChannel) {
          activeChannel.untrack().catch(() => {});
          supabase.removeChannel(activeChannel);
          activeChannel = null;
        }
      } catch (_) {}
    };
  } catch (err) {
    console.warn('Realtime presence tracking non-fatal error:', err);
    return () => {};
  }
}

/**
 * Broadcast remote logout command to target session
 */
export async function broadcastRemoteLogout(sessionId) {
  if (!sessionId) return;
  try {
    const channelId = `kirana_logout_${Date.now()}`;
    const channel = supabase.channel(channelId);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'remote_logout',
      payload: { sessionId }
    });
    try {
      supabase.removeChannel(channel);
    } catch (_) {}
  } catch (err) {
    console.warn('Could not broadcast remote logout:', err);
  }
}
