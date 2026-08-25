import type { FileKind } from "@/types";

const KIND_BY_EXT: Record<string, FileKind> = {
  pdf: "pdf",
  doc: "document",
  docx: "document",
  odt: "document",
  rtf: "document",
  txt: "document",
  md: "document",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  ods: "sheet",
  ppt: "presentation",
  pptx: "presentation",
  odp: "presentation",
};

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB soft cap

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

export function detectFileKind(name: string, mime: string): FileKind {
  const kind = KIND_BY_EXT[fileExtension(name)];
  if (kind) return kind;
  if (mime.startsWith("image/")) return "image";
  return "other";
}

export const FILE_KIND_META: Record<
  FileKind,
  { label: string; className: string }
> = {
  pdf: { label: "PDF", className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40" },
  document: { label: "Document", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40" },
  sheet: { label: "Sheet", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" },
  presentation: { label: "Slides", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40" },
  image: { label: "Image", className: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40" },
  other: { label: "File", className: "bg-muted text-muted-foreground border-border" },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
