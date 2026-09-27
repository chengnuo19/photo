import { createContext, useContext } from 'react';
import type { BookDoc } from '../../data/schema';
import type { ImportedImage } from '../../storage/assets';

/**
 * Editing API shared with theme pages. Absent (null) in read mode, so themes render plain
 * content by default and only become editable inside the editor.
 */
export interface EditApi {
  /** Apply a mutation to the stored (unresolved) book. */
  update: (recipe: (draft: BookDoc) => void) => void;
  /** Open the file picker for one image. */
  pickImage: () => Promise<ImportedImage | null>;
  importFile: (file: File) => Promise<ImportedImage>;
}

export const EditContext = createContext<EditApi | null>(null);

export const useEdit = () => useContext(EditContext);
