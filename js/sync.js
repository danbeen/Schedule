/**
 * Remote sync for Morning Checklist v2.
 * Parent and child stay in sync via Supabase (optional).
 * Set window.MORNING_V2_SUPABASE = { url: 'https://xxx.supabase.co', anonKey: 'xxx' } before loading this script.
 * If not set, sync is no-op and app works with localStorage only.
 */

(function () {
  const PREFIX = 'morning_v2_';
  const HOUSEHOLD_KEY = PREFIX + 'household_id';

  function getHouseholdId() {
    return localStorage.getItem(HOUSEHOLD_KEY);
  }

  function setHouseholdId(id) {
    if (id && typeof id === 'string') {
      localStorage.setItem(HOUSEHOLD_KEY, id.trim().toLowerCase());
      return true;
    }
    return false;
  }

  function generateHouseholdId() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function ensureHouseholdId() {
    let id = getHouseholdId();
    if (!id) {
      id = generateHouseholdId();
      setHouseholdId(id);
    }
    return id;
  }

  function getConfig() {
    return typeof window !== 'undefined' && window.MORNING_V2_SUPABASE && window.MORNING_V2_SUPABASE.url && window.MORNING_V2_SUPABASE.anonKey
      ? window.MORNING_V2_SUPABASE
      : null;
  }

  function getSupabase() {
    const config = getConfig();
    if (!config || !window.supabase || !window.supabase.createClient) return null;
    try {
      return window.supabase.createClient(config.url, config.anonKey);
    } catch (e) {
      return null;
    }
  }

  function loadFromSupabase(callback) {
    const config = getConfig();
    if (!config) {
      if (callback) callback(null);
      return Promise.resolve(null);
    }
    const id = getHouseholdId();
    if (!id) {
      if (callback) callback(null);
      return Promise.resolve(null);
    }
    const supabase = getSupabase();
    if (!supabase) {
      if (callback) callback(null);
      return Promise.resolve(null);
    }
    return supabase
      .from('household_sync')
      .select('payload')
      .eq('id', id)
      .maybeSingle()
      .then(function (res) {
        if (res.error) {
          if (callback) callback(null);
          return null;
        }
        const payload = res.data && res.data.payload ? res.data.payload : null;
        if (callback) callback(payload);
        return payload;
      })
      .catch(function () {
        if (callback) callback(null);
        return null;
      });
  }

  function saveToSupabase(callback) {
    const config = getConfig();
    if (!config) {
      if (callback) callback(false);
      return Promise.resolve(false);
    }
    const id = getHouseholdId();
    if (!id) {
      if (callback) callback(false);
      return Promise.resolve(false);
    }
    const M = window.MorningV2;
    if (!M || !M.getFullState) {
      if (callback) callback(false);
      return Promise.resolve(false);
    }
    const supabase = getSupabase();
    if (!supabase) {
      if (callback) callback(false);
      return Promise.resolve(false);
    }
    const state = M.getFullState();
    return supabase
      .from('household_sync')
      .upsert({ id: id, payload: state, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .then(function (res) {
        const ok = !res.error;
        if (callback) callback(ok);
        return ok;
      })
      .catch(function () {
        if (callback) callback(false);
        return false;
      });
  }

  function subscribeToSupabase(onUpdate) {
    const config = getConfig();
    if (!config || typeof onUpdate !== 'function') return function unsubscribe() {};
    const id = getHouseholdId();
    if (!id) return function unsubscribe() {};
    const supabase = getSupabase();
    if (!supabase) return function unsubscribe() {};
    try {
      const channel = supabase
        .channel('household_' + id)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'household_sync', filter: 'id=eq.' + id },
          function (payload) {
            const newPayload = payload.new && payload.new.payload ? payload.new.payload : null;
            if (newPayload && window.MorningV2 && window.MorningV2.setFullState) {
              window.MorningV2.setFullState(newPayload);
              onUpdate(newPayload);
            }
          }
        )
        .subscribe();
      return function unsubscribe() {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      };
    } catch (e) {
      return function unsubscribe() {};
    }
  }

  window.MorningV2Sync = {
    getHouseholdId: getHouseholdId,
    setHouseholdId: setHouseholdId,
    ensureHouseholdId: ensureHouseholdId,
    isConfigured: function () { return !!getConfig(); },
    loadFromSupabase: loadFromSupabase,
    saveToSupabase: saveToSupabase,
    subscribeToSupabase: subscribeToSupabase
  };
})();
