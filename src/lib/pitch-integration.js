export const PITCH_PROVIDER = 'transpose';
export const PITCH_INTEGRATION_ENABLED = false;

export function getPitchIntegrationStatus() {
  return {
    provider: PITCH_PROVIDER,
    enabled: PITCH_INTEGRATION_ENABLED,
    reason: PITCH_INTEGRATION_ENABLED ? '' : 'awaiting-external-link-support',
  };
}

export function buildPitchHandoffPayload(song, scaleSong = null) {
  return {
    provider: PITCH_PROVIDER,
    youtubeUrl: song?.youtubeUrl || '',
    songId: song?.id || '',
    songName: song?.name || '',
    originalKey: song?.originalKey || '',
    scaleKey: scaleSong?.key || '',
  };
}
