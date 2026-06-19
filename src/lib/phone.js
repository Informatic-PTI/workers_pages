export function normalizeEmail(email) {
	if (!email) return null;
	const normalized = String(email).trim().toLowerCase();
	return normalized.includes("@") ? normalized : null;
}

export function normalizePhone(phone) {
	if (!phone) return null;
	let value = String(phone).trim().replace(/[^\d+]/g, "");
	if (value.startsWith("+628")) value = `628${value.slice(4)}`;
	else if (value.startsWith("08")) value = `628${value.slice(2)}`;
	else if (value.startsWith("8")) value = `62${value}`;
	if (!/^628\d{7,15}$/.test(value)) return null;
	return value;
}

export function maskPhone(phone) {
	if (!phone) return null;
	return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

export function maskEmail(email) {
	if (!email) return null;
	const [name, domain] = email.split("@");
	return `${name.slice(0, 2)}***@${domain}`;
}
