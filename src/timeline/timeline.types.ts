export type TimelineBlockKind = 'leftHand' | 'rightHand' | 'note' | 'automation' | 'section';

export interface TimelineBlock {
  id: string;
  kind: TimelineBlockKind;
  trackId: string;
  startMs: number;
  durationMs: number;
  label: string;
  selected?: boolean;
}

export interface TimelineTrack {
  id: string;
  label: string;
  blocks: TimelineBlock[];
}

export interface TimelineDocument {
  durationMs: number;
  tracks: TimelineTrack[];
  playheadMs: number;
}
