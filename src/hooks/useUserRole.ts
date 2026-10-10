import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Cache constants
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface RoleCache {
  isAdmin: boolean;
  timestamp: number;
}

// Global cache to prevent excessive database calls
const roleCache = new Map<string, RoleCache>();

export const clearRoleCache = () => roleCache.clear();

// Drop cached roles whenever the session changes (sign-out, user switch)
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    clearRoleCache();
  }
});

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Track if component is mounted to prevent state updates on unmounted components
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const now = Date.now();
      const cached = roleCache.get(user.id);

      // Check if we have a valid cache entry
      if (cached && now - cached.timestamp < ROLE_CACHE_DURATION) {
        if (isMountedRef.current) {
          setIsAdmin(cached.isAdmin);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;

        const adminStatus = !!data;
        
        // Cache the result
        roleCache.set(user.id, {
          isAdmin: adminStatus,
          timestamp: now
        });

        if (isMountedRef.current) {
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        if (isMountedRef.current) {
          setIsAdmin(false);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user?.id, authLoading]);

  return { isAdmin, loading: loading || authLoading };
};
