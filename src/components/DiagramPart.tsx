import { ChevronDown, PenTool } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DiagramOutput {
  title: string;
  diagramType: "flowchart" | "sequence" | "class";
  mermaidSyntax: string;
}

// Module-scope promise so Excalidraw is only loaded once across all diagram instances
let excalidrawModulesPromise: Promise<{
  parseMermaidToExcalidraw: typeof import("@excalidraw/mermaid-to-excalidraw").parseMermaidToExcalidraw;
  convertToExcalidrawElements: typeof import("@excalidraw/excalidraw").convertToExcalidrawElements;
  exportToSvg: typeof import("@excalidraw/excalidraw").exportToSvg;
}> | null = null;

function loadExcalidrawModules() {
  if (!excalidrawModulesPromise) {
    excalidrawModulesPromise = Promise.all([
      import("@excalidraw/mermaid-to-excalidraw"),
      import("@excalidraw/excalidraw"),
    ]).then(([mermaidMod, excalidrawMod]) => ({
      parseMermaidToExcalidraw: mermaidMod.parseMermaidToExcalidraw,
      convertToExcalidrawElements: excalidrawMod.convertToExcalidrawElements,
      exportToSvg: excalidrawMod.exportToSvg,
    }));
  }
  return excalidrawModulesPromise;
}

export function DiagramPart({
  state,
  output,
}: {
  state: string;
  output?: DiagramOutput;
}) {
  const [open, setOpen] = useState(true);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (state !== "output-available" || !output?.mermaidSyntax) return;

    let cancelled = false;

    (async () => {
      try {
        const modules = await loadExcalidrawModules();
        if (cancelled) return;

        const { elements: rawElements, files } =
          await modules.parseMermaidToExcalidraw(output.mermaidSyntax);
        if (cancelled) return;

        const elements = modules.convertToExcalidrawElements(rawElements);

        const svg = await modules.exportToSvg({
          elements,
          files: files ?? null,
          appState: {
            exportWithDarkMode: false,
            exportBackground: true,
            viewBackgroundColor: "#ffffff",
          },
          exportPadding: 16,
        });
        if (cancelled) return;

        const svgString = svg.outerHTML;
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        if (!mountedRef.current || cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        setSvgUrl(url);
      } catch (e) {
        if (!cancelled && mountedRef.current) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, output]);

  useEffect(() => {
    return () => {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
    };
  }, [svgUrl]);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <PenTool size={14} className="animate-pulse" />
        Drawing diagram...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#da9ee6] bg-[#fce9ec] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <PenTool size={14} className="text-[#9a24b2]" />
        {output?.title ?? "Diagram"}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-[#da9ee6] px-3 py-2">
          {error ? (
            <div>
              <p className="text-red-500 mb-2">
                Could not render diagram: {error}
              </p>
              <pre className="rounded-lg bg-[#1a1a1a] text-[#da9ee6] p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                {output?.mermaidSyntax}
              </pre>
            </div>
          ) : svgUrl ? (
            <div
              className="overflow-auto bg-white rounded-lg"
              style={{ maxHeight: 500 }}
            >
              <img
                src={svgUrl}
                alt={output?.title ?? "Diagram"}
                className="block w-full h-auto"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#8b8b8b] italic py-2">
              <PenTool size={14} className="animate-pulse" />
              Rendering...
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
