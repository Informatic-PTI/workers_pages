const TOKEN_KEY = "irwanmotor.auth";
let memory = loadStored();

function stores() {
	return [localStorage, sessionStorage];
}

function loadStored() {
	for (const store of stores()) {
		try {
			const value = JSON.parse(store.getItem(TOKEN_KEY) || "null");
			if (value?.access_token) return { ...value, persistent: store === localStorage };
		} catch { /* Ignore malformed legacy browser state. */ }
	}
	return null;
}

export function authState() { return memory; }
export function accessToken() { return memory?.access_token || null; }
export function refreshToken() { return memory?.refresh_token || null; }
export function currentUser() { return memory?.profile?.user || memory?.user || null; }
export function currentRoles() { return memory?.profile?.roles || (memory?.user?.is_hyperuser ? ["admin", "hyperuser"] : []); }
export function isAuthenticated() { return Boolean(accessToken()); }

export function saveTokens(data, persistent = memory?.persistent ?? true) {
	memory = { ...(memory || {}), ...data, persistent };
	const selected = persistent ? localStorage : sessionStorage;
	const other = persistent ? sessionStorage : localStorage;
	other.removeItem(TOKEN_KEY);
	selected.setItem(TOKEN_KEY, JSON.stringify(memory));
	window.dispatchEvent(new CustomEvent("session:changed", { detail: memory }));
	return memory;
}

export function saveProfile(profile) {
	if (!memory) return;
	memory = { ...memory, profile };
	saveTokens(memory, memory.persistent);
}

export function clearSession() {
	memory = null;
	for (const store of stores()) store.removeItem(TOKEN_KEY);
	window.dispatchEvent(new CustomEvent("session:changed", { detail: null }));
}
