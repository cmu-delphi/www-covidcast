export function formToConfig(formData: FormData): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    if (key.startsWith('_') || value === '' || key === 'type') {
      return;
    }
    if (key.includes('.')) {
      const parts = key.split('.');
      let level = config;
      for (const p of parts.slice(0, -1)) {
        if (p in level) {
          level = level[p] as Record<string, unknown>;
        } else {
          level[p] = {};
          level = level[p] as Record<string, unknown>;
        }
      }
      level[parts[parts.length - 1]] = value;
    } else if (key in config) {
      const v = config[key];
      if (Array.isArray(v)) {
        v.push(value);
      } else {
        config[key] = [v, value];
      }
    } else {
      config[key] = value;
    }
  });
  return config;
}
