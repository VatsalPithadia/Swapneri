// ==============================================================================
// lib/services/auth.service.ts
// Authentication & Session Management Service (Supabase + Local Fallback)
// ==============================================================================

import { supabase } from '../supabase/client';
import { shopService } from './shop.service';

const SESSION_COOKIE_NAME = 'swapneri_session';

function setSessionCookie(active: boolean) {
  if (typeof document === 'undefined') return;
  if (active) {
    document.cookie = `${SESSION_COOKIE_NAME}=true; path=/; max-age=2592000; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

function isLiveSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co'));
}

export interface AuthUser {
  id: string;
  email: string;
  shopName?: string;
  ownerName?: string;
  phone?: string;
}

export const authService = {
  async signIn(params: { email: string; password: string }): Promise<AuthUser> {
    const { email, password } = params;

    if (isLiveSupabase()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSessionCookie(true);

      // Sync the user's shop profile
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('shop_id')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile?.shop_id) {
            const { data: shopData } = await supabase
              .from('shops')
              .select('*')
              .eq('id', profile.shop_id)
              .maybeSingle();

            if (shopData) {
              await shopService.updateShop(shopData);
            }
          }
        } catch (e) {
          console.warn('Failed to sync shop on login:', e);
        }

        return {
          id: data.user.id,
          email: data.user.email || email,
          ownerName: data.user.user_metadata?.owner_name,
          shopName: data.user.user_metadata?.shop_name,
          phone: data.user.user_metadata?.phone,
        };
      }
    }

    // Local / Offline fallback
    setSessionCookie(true);
    const shop = await shopService.getShop();
    return {
      id: 'demo-user-id',
      email,
      shopName: shop.name,
      ownerName: shop.owner_name,
      phone: shop.phone,
    };
  },

  async signUp(params: {
    email: string;
    password: string;
    shopName: string;
    ownerName: string;
    phone: string;
    address?: string;
  }): Promise<AuthUser> {
    const { email, password, shopName, ownerName, phone, address } = params;

    if (isLiveSupabase()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            shop_name: shopName,
            owner_name: ownerName,
            phone,
            address: address || null,
          },
        },
      });

      if (error) {
        throw error;
      }

      setSessionCookie(true);

      // Immediately save shop profile to guarantee dynamic display everywhere
      await shopService.updateShop({
        name: shopName,
        owner_name: ownerName,
        phone,
        address: address || null,
      });

      return {
        id: data.user?.id || 'new-user',
        email,
        shopName,
        ownerName,
        phone,
      };
    }

    // Local / Offline fallback
    setSessionCookie(true);
    await shopService.updateShop({
      name: shopName,
      owner_name: ownerName,
      phone,
      address: address || null,
    });

    return {
      id: 'demo-user-id',
      email,
      shopName,
      ownerName,
      phone,
    };
  },

  async demoSignIn(): Promise<AuthUser> {
    setSessionCookie(true);
    const shop = await shopService.getShop();
    return {
      id: 'demo-user-id',
      email: 'owner@swapneri.com',
      shopName: shop.name,
      ownerName: shop.owner_name,
      phone: shop.phone,
    };
  },

  async signOut(): Promise<void> {
    if (isLiveSupabase()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setSessionCookie(false);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (isLiveSupabase()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const shop = await shopService.getShop();
          return {
            id: user.id,
            email: user.email || '',
            shopName: shop.name,
            ownerName: shop.owner_name,
            phone: shop.phone,
          };
        }
      } catch {
        // fallback
      }
    }

    if (typeof document !== 'undefined' && document.cookie.includes(`${SESSION_COOKIE_NAME}=true`)) {
      const shop = await shopService.getShop();
      return {
        id: 'demo-user-id',
        email: 'owner@swapneri.com',
        shopName: shop.name,
        ownerName: shop.owner_name,
        phone: shop.phone,
      };
    }

    return null;
  },
};

