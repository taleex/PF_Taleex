import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileJson, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  portfolioSnapshotSchema,
  type PortfolioSnapshot,
} from "@/types/portfolio-content";

const TABLE_NAMES = [
  "profiles",
  "projects",
  "experiences",
  "skill_categories",
  "skills",
  "contact_info",
  "page_sections",
  "site_content",
  "site_images",
  "education",
  "courses",
  "languages",
] as const;

const CURRENT_DRAFT_ID = "c6938771-507d-44b5-b69d-9e0b39e42974";

type ImportResult = {
  kind: "staged" | "published";
  affectedRows: Record<string, number>;
};

const validateSnapshot = (value: unknown): PortfolioSnapshot => {
  const result = portfolioSnapshotSchema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "snapshot"}: ${issue.message}`)
      .join("; ");
    throw new Error(details);
  }
  return result.data;
};

const resultCounts = (value: Json | null): Record<string, number> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const counts = value.affectedRows;
  if (typeof counts !== "object" || counts === null || Array.isArray(counts)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(counts).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    ),
  );
};

const errorCode = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";

const errorMessage = (error: unknown): string =>
  typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : "";

const isMissingTable = (error: unknown): boolean =>
  errorCode(error) === "PGRST205" ||
  errorMessage(error).includes("Could not find the table");

const isMissingFunction = (error: unknown): boolean =>
  errorCode(error) === "PGRST202" ||
  errorMessage(error).includes("Could not find the function");

const snapshotCounts = (
  data: PortfolioSnapshot["data"],
): Record<string, number> =>
  Object.fromEntries(TABLE_NAMES.map((table) => [table, data[table].length]));

const PortfolioDataManager = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const loadSavedDraft = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("portfolio_content_drafts")
        .select("payload,updated_at,published_at,publish_result")
        .eq("id", CURRENT_DRAFT_ID)
        .maybeSingle();
      if (error) {
        // The draft table is optional; skip quietly until it is deployed.
        if (isMissingTable(error)) return;
        throw error;
      }
      if (!data) return;

      const savedSnapshot = validateSnapshot(data.payload);
      setSnapshot(savedSnapshot);
      setJsonText(JSON.stringify(savedSnapshot, null, 2));
      setDraftUpdatedAt(data.updated_at);
      if (data.published_at) {
        setHasDraft(false);
        setImportResult({
          kind: "published",
          affectedRows: resultCounts(data.publish_result),
        });
      } else {
        setHasDraft(true);
        setImportResult(null);
      }
    } catch (error: unknown) {
      toast({
        title: "Could not load saved draft",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    void loadSavedDraft();
  }, [loadSavedDraft]);

  const loadFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Choose a JSON file under 5 MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = validateSnapshot(JSON.parse(await file.text()));
      setJsonText(JSON.stringify(parsed, null, 2));
      setSnapshot(parsed);
      setHasDraft(false);
      setDraftUpdatedAt(null);
      setImportResult(null);
      toast({
        title: "Snapshot loaded",
        description: "Review the table counts before saving a draft.",
      });
    } catch (error: unknown) {
      setSnapshot(null);
      toast({
        title: "Invalid snapshot",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    setHasDraft(false);
    setDraftUpdatedAt(null);
    setImportResult(null);
    try {
      setSnapshot(validateSnapshot(JSON.parse(text)));
    } catch {
      setSnapshot(null);
    }
  };

  const exportSnapshot = async () => {
    setBusy(true);
    try {
      const missingTables: string[] = [];
      const entries = await Promise.all(
        TABLE_NAMES.map(async (table) => {
          const { data, error } = await supabase.from(table).select("*");
          if (error) {
            // Tables not deployed yet are exported as empty instead of failing.
            if (isMissingTable(error)) {
              missingTables.push(table);
              return [table, []] as const;
            }
            throw new Error(`Could not export ${table}: ${error.message}`);
          }
          return [table, data ?? []] as const;
        }),
      );
      const sanitized = portfolioSnapshotSchema.parse({
        formatVersion: 2,
        exportedAt: new Date().toISOString(),
        data: Object.fromEntries(entries),
      });
      const blob = new Blob([JSON.stringify(sanitized, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `portfolio-content-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export complete",
        description: missingTables.length
          ? `Live content exported. Not present in the database yet: ${missingTables.join(", ")}.`
          : "Live database content was exported.",
      });
    } catch (error: unknown) {
      toast({
        title: "Export failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    let parsed: PortfolioSnapshot;
    try {
      parsed = validateSnapshot(JSON.parse(jsonText));
    } catch (error: unknown) {
      toast({
        title: "Invalid snapshot",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }

    const counts = TABLE_NAMES.map(
      (table) => `${table}: ${parsed.data[table].length}`,
    ).join("\n");
    if (
      !window.confirm(
        `Save this snapshot as an unpublished draft? The live database and public site will remain unchanged.\n\n${counts}`,
      )
    )
      return;

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("save_portfolio_draft", {
        payload: parsed as unknown as Json,
      });

      const updatedAt = new Date().toISOString();

      if (error) {
        if (!isMissingFunction(error)) throw error;

        // Draft objects are not deployed yet: keep the validated snapshot in
        // this browser session so it can still be applied with Publish.
        const localCounts = snapshotCounts(parsed.data);
        const localTotal = Object.values(localCounts).reduce(
          (sum, count) => sum + count,
          0,
        );
        setSnapshot(parsed);
        setHasDraft(true);
        setDraftUpdatedAt(updatedAt);
        setImportResult({ kind: "staged", affectedRows: localCounts });
        toast({
          title: "Draft staged in this session",
          description: `${localTotal} rows held in the browser until you publish.`,
        });
        return;
      }

      const countsByTable = resultCounts(data);
      const stagedTotal = Object.values(countsByTable).reduce(
        (sum, count) => sum + count,
        0,
      );
      setSnapshot(parsed);
      setHasDraft(true);
      setDraftUpdatedAt(updatedAt);
      setImportResult({ kind: "staged", affectedRows: countsByTable });
      toast({
        title: "Draft saved",
        description: `${stagedTotal} rows staged; live tables are unchanged.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Draft save failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const applySnapshotDirect = async (draft: PortfolioSnapshot) => {
    const counts: Record<string, number> = {};
    const skipped: string[] = [];

    for (const table of TABLE_NAMES) {
      const rows = draft.data[table];
      if (rows.length === 0) {
        counts[table] = 0;
        continue;
      }

      const { error } = await supabase
        .from(table)
        .upsert(rows as never, { onConflict: "id" });
      if (error) {
        if (isMissingTable(error)) {
          skipped.push(table);
          continue;
        }
        throw error;
      }
      counts[table] = rows.length;
    }

    return { counts, skipped };
  };

  const publishDraft = async () => {
    if (
      !window.confirm(
        "Publish this staged snapshot to the live portfolio tables? This will make its profile, project, experience, skill, contact, and site content changes visible on the existing public pages.",
      )
    )
      return;

    setBusy(true);
    try {
      let countsByTable: Record<string, number>;
      let skippedTables: string[] = [];

      const { data, error } = await supabase.rpc("publish_portfolio_draft", {});
      if (!error) {
        countsByTable = resultCounts(data);
      } else if (isMissingFunction(error)) {
        if (!snapshot) {
          throw new Error(
            "No staged snapshot is available in this session. Load the JSON again and save the draft.",
          );
        }
        const applied = await applySnapshotDirect(snapshot);
        countsByTable = applied.counts;
        skippedTables = applied.skipped;
      } else {
        throw error;
      }

      const publishedTotal = Object.values(countsByTable).reduce(
        (sum, count) => sum + count,
        0,
      );
      setHasDraft(false);
      setDraftUpdatedAt(null);
      setImportResult({ kind: "published", affectedRows: countsByTable });
      toast({
        title: "Portfolio published",
        description:
          `${publishedTotal} live rows upserted across ${Object.keys(countsByTable).length} tables.` +
          (skippedTables.length
            ? ` Skipped tables not present in the database: ${skippedTables.join(", ")}.`
            : ""),
      });
    } catch (error: unknown) {
      toast({
        title: "Publish failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const totalAffected = importResult
    ? Object.values(importResult.affectedRows).reduce(
        (sum, count) => sum + count,
        0,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#0A0908]">
          Portfolio Data
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Import saves a private draft. Publishing is separate and updates live
          database rows.
        </p>
      </div>

      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[#0A0908]">
            <FileJson className="h-5 w-5" />
            Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={exportSnapshot} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export live JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <Upload className="mr-2 h-4 w-4" />
              Load JSON file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void loadFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio-snapshot">Snapshot JSON</Label>
            <Textarea
              id="portfolio-snapshot"
              value={jsonText}
              onChange={(event) => handleTextChange(event.target.value)}
              placeholder="Load or paste a version 2 portfolio snapshot."
              className="min-h-72 font-mono text-xs"
              spellCheck={false}
            />
          </div>

          {snapshot && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-[#0A0908]">
                Validated snapshot
              </h3>
              <ul className="grid gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-3">
                {TABLE_NAMES.map((table) => (
                  <li key={table} className="flex justify-between gap-4">
                    <span>{table.replace(/_/g, " ")}</span>
                    <span className="font-medium tabular-nums">
                      {snapshot.data[table].length}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500">
                Exported {new Date(snapshot.exportedAt).toLocaleString()}.
              </p>
            </section>
          )}

          {hasDraft && draftUpdatedAt && (
            <p className="text-sm text-gray-600">
              Unpublished draft saved{" "}
              {new Date(draftUpdatedAt).toLocaleString()}.
            </p>
          )}

          {importResult && (
            <section
              aria-live="polite"
              role="status"
              className="space-y-2 border-t border-gray-200 pt-4"
            >
              <h3 className="text-sm font-medium text-[#0A0908]">
                {importResult.kind === "staged"
                  ? "Rows staged; live site unchanged"
                  : "Live rows upserted"}
              </h3>
              <p className="text-sm text-gray-600">
                {totalAffected} rows{" "}
                {importResult.kind === "staged" ? "staged" : "published"} across{" "}
                {Object.keys(importResult.affectedRows).length} tables.
              </p>
              <ul className="grid gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-3">
                {TABLE_NAMES.map((table) => (
                  <li key={table} className="flex justify-between gap-4">
                    <span>{table.replace(/_/g, " ")}</span>
                    <span className="font-medium tabular-nums">
                      {importResult.affectedRows[table] ?? 0} rows
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm text-gray-600">
              Imports are validated with Zod, then only the explicit Publish
              action writes to the live tables. Omitted rows remain unchanged.
              Tables that are not present in the database yet are skipped and
              listed. Messages, user roles, and uploaded files are excluded.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void saveDraft()}
                disabled={!snapshot || busy}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Save draft
              </Button>
              <Button
                type="button"
                onClick={() => void publishDraft()}
                disabled={!hasDraft || busy}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Publish draft
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioDataManager;
