import { samePrivateDraft, type PrivateDraft, type PrivateDraftStore } from './protected-store';

// Web is a labelled synthetic-only, in-memory preview, never a plaintext
// localStorage/IndexedDB/cookie fallback for protected mobile persistence.
let preview: PrivateDraft | null = null;
export const privateDraftStore: PrivateDraftStore = {
  async load() { return preview ? { ...preview } : null; },
  async save(draft) { preview = { ...draft }; },
  async discard() { preview = null; },
  async discardIfUnchanged(expected) { if (!preview || !samePrivateDraft(preview, expected)) return false; preview = null; return true; },
};
