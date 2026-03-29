export type Config = {};

export function parseConfig(data: unknown): Config {
	if (typeof data !== "object") {
		throw new Error("config must be an object");
	}

	return {};
}
