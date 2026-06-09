"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordFileDocumentAction } from "../actions";
import { validateFile } from "../lib";

const ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip";

/** Validates client-side, uploads to the private bucket (RLS-gated), then records the metadata. */
export function FileUpload({ projectId }: { projectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-picked
    if (!file) return;

    const invalid = validateFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);

    start(async () => {
      const supabase = createClient();
      const path = `${projectId}/${crypto.randomUUID()}/${file.name}`;
      const uploaded = await supabase.storage
        .from("project-documents")
        .upload(path, file, { contentType: file.type });
      if (uploaded.error) {
        setError("Couldn’t upload that file — please try again.");
        return;
      }
      const res = await recordFileDocumentAction(projectId, {
        title: file.name,
        file_path: path,
        file_size: file.size,
        file_mime: file.type,
      });
      if (!res.ok) {
        setError(res.error);
        await supabase.storage.from("project-documents").remove([path]); // best-effort cleanup
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="border-line-1 text-text-1 hover:bg-bg-3 hover:text-text h-9 rounded-md border px-3 text-[13px] font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload file"}
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
      {error && (
        <p role="alert" className="text-[12px] text-[#FFB6A2]">
          {error}
        </p>
      )}
    </>
  );
}
