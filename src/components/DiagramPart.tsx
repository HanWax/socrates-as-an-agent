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
  const [open, setOpen] = useState<boolean>(true);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (state !== "output-available" || !output?.mermaidSyntax) return;

    let cancelled = false;
    setError(null);
    setSvgUrl(null);
    setSvgDimensions(null);

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

        const widthAttr = svg.getAttribute("width");
        const heightAttr = svg.getAttribute("height");
        let width = widthAttr ? Number.parseFloat(widthAttr) : Number.NaN;
        let height = heightAttr ? Number.parseFloat(heightAttr) : Number.NaN;

        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          const viewBox = svg.getAttribute("viewBox");
          if (viewBox) {
            const parts = viewBox.trim().split(/\s+/).map(Number);
            if (parts.length === 4) {
              width = parts[2];
              height = parts[3];
            }
          }
        }

        if (Number.isFinite(width) && Number.isFinite(height)) {
          setSvgDimensions({ width, height });
        }

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
        <PenTool
          size={14}
          className="animate-pulse motion-reduce:animate-none"
        />
        Drawing diagram…
      </div>
    );
  }

  const diagramWidth = svgDimensions?.width ?? 800;
  const diagramHeight = svgDimensions?.height ?? 600;

  return (
    <div className="my-2 rounded-xl border border-[#D4CFC6] bg-[#EDE8DF] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a] rounded-t-xl hover:bg-[#D4CFC6]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D3557]/60"
      >
        <PenTool size={14} className="text-[#1D3557]" />
        {output?.title ?? "Diagram"}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-[#D4CFC6] px-3 py-2">
          {error ? (
            <div>
              <p className="text-red-500 mb-2">
                Could not render diagram: {error}
              </p>
              <pre className="rounded-lg bg-[#1a1a1a] text-[#D8E2F0] p-3 text-xs overflow-x-auto whitespace-pre-wrap">
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
                width={diagramWidth}
                height={diagramHeight}
                className="block w-full h-auto"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#8b8b8b] italic py-2">
              <PenTool
                size={14}
                className="animate-pulse motion-reduce:animate-none"
              />
              Rendering…
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
