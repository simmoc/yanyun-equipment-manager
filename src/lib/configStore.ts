let _configData: any = null;
let _configPromise: Promise<any> | null = null;

export function setConfigData(data: any) {
  _configData = data;
}

export function getConfigData() {
  return _configData;
}

export async function ensureConfigData() {
  if (_configData) return _configData;
  if (!_configPromise) {
    _configPromise = fetch('/api/config')
      .then(async (response) => {
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load config data');
        }
        _configData = data.data;
        return _configData;
      })
      .catch((error) => {
        _configPromise = null;
        throw error;
      });
  }
  return _configPromise;
}
