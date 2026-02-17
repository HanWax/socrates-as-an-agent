import { useChat } from "@ai-sdk/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import {
  BookmarkCheck,
  BookOpen,
  Brain,
  BrainCircuit,
  ChevronDown,
  FileText,
  GitBranch,
  Globe,
  GraduationCap,
  ImagePlus,
  Layers,
  Menu,
  Newspaper,
  ShieldCheck,
  Swords,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DiagramPart } from "../components/DiagramPart";
import { Sidebar } from "../components/sidebar";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_COUNT = 4;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function filterValidFiles(fileList: File[]): File[] {
  return fileList
    .filter((f) => ALLOWED_FILE_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE)
    .slice(0, MAX_FILE_COUNT);
}

export const Route = createFileRoute("/")({
  component: Chat,
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search.c === "string" ? search.c : undefined,
  }),
});

const composerShadow = "10px 10px 18px rgba(166, 180, 200, 0.4)";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function WebSearchPart({
  state,
  output,
}: {
  state: string;
  output?: { results: SearchResult[]; error?: string };
}) {
  const [open, setOpen] = useState(false);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Globe size={14} className="animate-spin" />
        Searching the web...
      </div>
    );
  }

  const results = output?.results ?? [];

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <Globe size={14} className="text-[#5BA8A0]" />
        Web search ({results.length} results)
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-2">
          {results.map((r) => (
            <div key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#5BA8A0] hover:underline"
              >
                {r.title}
              </a>
              <p className="text-[#8b8b8b] leading-snug">{r.snippet}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SaveInsightPart({
  state,
  output,
}: {
  state: string;
  output?: { saved: boolean; insight: string; topic: string | null };
}) {
  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <BookmarkCheck size={14} className="animate-pulse" />
        Saving insight...
      </div>
    );
  }

  return (
    <div className="my-2 flex items-start gap-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] px-3 py-2 text-[13px]">
      <BookmarkCheck size={14} className="mt-0.5 text-[#5BA8A0] shrink-0" />
      <div>
        <span className="font-medium text-[#1a1a1a]">Insight saved</span>
        {output?.topic ? (
          <span className="text-[#8b8b8b]"> in {output.topic}</span>
        ) : null}
      </div>
    </div>
  );
}

interface DevilsAdvocateOutput {
  userPosition: string;
  steelmanArgument: string;
  keyEvidence: string[];
  challengeQuestion: string;
}

function DevilsAdvocatePart({
  state,
  output,
}: {
  state: string;
  output?: DevilsAdvocateOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Swords size={14} className="animate-pulse" />
        Building strongest counterargument...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <Swords size={14} className="text-[#5BA8A0]" />
        Devil's Advocate
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-2">
          <p className="text-[#8b8b8b]">
            <span className="font-medium text-[#1a1a1a]">Your position: </span>
            {output.userPosition}
          </p>
          <p className="text-[#1a1a1a] leading-snug">
            <span className="font-medium">Steelman: </span>
            {output.steelmanArgument}
          </p>
          {output.keyEvidence.length > 0 ? (
            <div>
              <span className="font-medium text-[#1a1a1a]">Key evidence:</span>
              <ul className="mt-1 space-y-1 text-[#1a1a1a]">
                {output.keyEvidence.map((e) => (
                  <li key={e} className="flex gap-1.5 leading-snug">
                    <span className="text-[#5BA8A0] shrink-0">&#8226;</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-[#5BA8A0] font-medium italic leading-snug">
            {output.challengeQuestion}
          </p>
        </div>
      ) : null}
    </div>
  );
}

interface FactCheckOutput {
  claim: string;
  verdict: "supported" | "partially_supported" | "unsupported" | "unverifiable";
  analysis: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
}

const verdictLabel: Record<FactCheckOutput["verdict"], string> = {
  supported: "Supported",
  partially_supported: "Partially Supported",
  unsupported: "Unsupported",
  unverifiable: "Unverifiable",
};

const verdictColor: Record<FactCheckOutput["verdict"], string> = {
  supported: "text-emerald-600",
  partially_supported: "text-amber-600",
  unsupported: "text-red-500",
  unverifiable: "text-[#8b8b8b]",
};

function FactCheckPart({
  state,
  output,
}: {
  state: string;
  output?: FactCheckOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <ShieldCheck size={14} className="animate-pulse" />
        Checking claim...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <ShieldCheck size={14} className="text-[#5BA8A0]" />
        Fact Check
        {output ? (
          <span className={`text-xs ${verdictColor[output.verdict]}`}>
            — {verdictLabel[output.verdict]}
          </span>
        ) : null}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-2">
          <p className="text-[#8b8b8b]">
            <span className="font-medium text-[#1a1a1a]">Claim: </span>
            &ldquo;{output.claim}&rdquo;
          </p>
          <p className="text-[#1a1a1a] leading-snug">{output.analysis}</p>
          {output.evidenceFor.length > 0 ? (
            <div>
              <span className="font-medium text-emerald-600">
                Evidence for:
              </span>
              <ul className="mt-1 space-y-1 text-[#1a1a1a]">
                {output.evidenceFor.map((e) => (
                  <li key={e} className="flex gap-1.5 leading-snug">
                    <span className="text-emerald-500 shrink-0">+</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {output.evidenceAgainst.length > 0 ? (
            <div>
              <span className="font-medium text-red-500">
                Evidence against:
              </span>
              <ul className="mt-1 space-y-1 text-[#1a1a1a]">
                {output.evidenceAgainst.map((e) => (
                  <li key={e} className="flex gap-1.5 leading-snug">
                    <span className="text-red-400 shrink-0">&minus;</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface LogicalAnalysisOutput {
  userReasoning: string;
  fallacy: string;
  explanation: string;
  example: string;
  betterFraming: string;
}

function LogicalAnalysisPart({
  state,
  output,
}: {
  state: string;
  output?: LogicalAnalysisOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Brain size={14} className="animate-pulse" />
        Analyzing reasoning...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <Brain size={14} className="text-[#5BA8A0]" />
        Logical Analysis
        {output ? (
          <span className="text-xs text-[#8b8b8b]">— {output.fallacy}</span>
        ) : null}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-2">
          <p className="text-[#8b8b8b]">
            <span className="font-medium text-[#1a1a1a]">Your reasoning: </span>
            &ldquo;{output.userReasoning}&rdquo;
          </p>
          <p className="text-[#1a1a1a] leading-snug">
            <span className="font-medium">Why it's a problem: </span>
            {output.explanation}
          </p>
          <p className="text-[#1a1a1a] leading-snug italic">
            <span className="font-medium not-italic">Analogy: </span>
            {output.example}
          </p>
          <p className="text-[#5BA8A0] leading-snug">
            <span className="font-medium">Better framing: </span>
            {output.betterFraming}
          </p>
        </div>
      ) : null}
    </div>
  );
}

interface PerspectiveOutput {
  stakeholder: string;
  position: string;
  reasoning: string;
}

interface PerspectiveShiftOutput {
  topic: string;
  perspectives: PerspectiveOutput[];
  blindSpotQuestion: string;
}

function PerspectiveShiftPart({
  state,
  output,
}: {
  state: string;
  output?: PerspectiveShiftOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Users size={14} className="animate-pulse" />
        Gathering perspectives...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <Users size={14} className="text-[#5BA8A0]" />
        Perspective Shift — {output?.perspectives.length ?? 0} viewpoints
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-3">
          {output.perspectives.map((p) => (
            <div key={p.stakeholder}>
              <p className="font-medium text-[#1a1a1a]">{p.stakeholder}</p>
              <p className="text-[#1a1a1a] leading-snug">{p.position}</p>
              <p className="text-[#8b8b8b] leading-snug">{p.reasoning}</p>
            </div>
          ))}
          <p className="text-[#5BA8A0] font-medium italic leading-snug">
            {output.blindSpotQuestion}
          </p>
        </div>
      ) : null}
    </div>
  );
}

interface ArgumentMapOutput {
  claim: string;
  premises: { text: string; evidence: string[] }[];
  conclusion: string;
  counterarguments?: { point: string; rebuttal?: string }[];
}

function ArgumentMapPart({
  state,
  output,
}: {
  state: string;
  output?: ArgumentMapOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <GitBranch size={14} className="animate-pulse" />
        Mapping argument structure...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <GitBranch size={14} className="text-[#5BA8A0]" />
        Argument Map
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-3">
          <div className="rounded-lg bg-[#5BA8A0]/10 px-3 py-2">
            <span className="font-medium text-[#1a1a1a]">Claim: </span>
            <span className="text-[#1a1a1a]">{output.claim}</span>
          </div>
          <div>
            <span className="font-medium text-[#1a1a1a]">Premises:</span>
            <div className="mt-1 space-y-2">
              {output.premises.map((p) => (
                <div key={p.text} className="border-l-2 border-[#5BA8A0] pl-3">
                  <p className="text-[#1a1a1a] leading-snug">{p.text}</p>
                  {p.evidence.length > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {p.evidence.map((e) => (
                        <li
                          key={e}
                          className="flex gap-1.5 text-[#8b8b8b] leading-snug"
                        >
                          <span className="text-[#5BA8A0] shrink-0">
                            &#8226;
                          </span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="font-medium text-[#1a1a1a]">Conclusion: </span>
            <span className="text-[#5BA8A0] font-medium">
              {output.conclusion}
            </span>
          </div>
          {output.counterarguments && output.counterarguments.length > 0 ? (
            <div>
              <span className="font-medium text-[#F08B8B]">
                Counterarguments:
              </span>
              <div className="mt-1 space-y-2">
                {output.counterarguments.map((ca) => (
                  <div
                    key={ca.point}
                    className="border-l-2 border-[#F08B8B] pl-3"
                  >
                    <p className="text-[#1a1a1a] leading-snug">{ca.point}</p>
                    {ca.rebuttal ? (
                      <p className="text-[#8b8b8b] leading-snug mt-0.5">
                        <span className="font-medium text-[#5BA8A0]">
                          Rebuttal:{" "}
                        </span>
                        {ca.rebuttal}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface ReadingRecommendation {
  title: string;
  author: string;
  type: "book" | "article" | "paper" | "video";
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface ReadingListOutput {
  topic: string;
  recommendations: ReadingRecommendation[];
}

const typeIcon: Record<ReadingRecommendation["type"], typeof BookOpen> = {
  book: BookOpen,
  article: FileText,
  paper: GraduationCap,
  video: Video,
};

const difficultyColor: Record<ReadingRecommendation["difficulty"], string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

function ReadingListPart({
  state,
  output,
}: {
  state: string;
  output?: ReadingListOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <BookOpen size={14} className="animate-pulse" />
        Curating reading list...
      </div>
    );
  }

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <BookOpen size={14} className="text-[#5BA8A0]" />
        Reading List — {output?.topic}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-3">
          {output.recommendations.map((rec) => {
            const Icon = typeIcon[rec.type];
            return (
              <div key={rec.title} className="flex gap-2">
                <Icon size={14} className="mt-0.5 text-[#5BA8A0] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#1a1a1a]">
                      {rec.title}
                    </span>
                    <span className="text-[#8b8b8b]">by {rec.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="rounded px-1.5 py-0.5 text-[11px] bg-[#d4eeec] text-[#5BA8A0]">
                      {rec.type}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] ${difficultyColor[rec.difficulty]}`}
                    >
                      {rec.difficulty}
                    </span>
                  </div>
                  <p className="text-[#8b8b8b] leading-snug mt-1">
                    {rec.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface DiscoverResource {
  title: string;
  url: string;
  snippet: string;
  publishedDate: string | null;
}

interface DiscoverResourcesOutput {
  topic: string;
  reason: string;
  resources: DiscoverResource[];
  error?: string;
}

function DiscoverResourcesPart({
  state,
  output,
}: {
  state: string;
  output?: DiscoverResourcesOutput;
}) {
  const [open, setOpen] = useState(true);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Newspaper size={14} className="animate-pulse" />
        Discovering recent resources...
      </div>
    );
  }

  const resources = output?.resources ?? [];

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <Newspaper size={14} className="text-[#5BA8A0]" />
        Recent Resources — {output?.topic}
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && output ? (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-3">
          <p className="text-[#5BA8A0] italic leading-snug">{output.reason}</p>
          {resources.map((r) => {
            let domain = "";
            try {
              domain = new URL(r.url).hostname.replace("www.", "");
            } catch {
              /* ignore */
            }
            return (
              <div key={r.url} className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#5BA8A0] hover:underline"
                  >
                    {r.title}
                  </a>
                  {domain ? (
                    <span className="rounded px-1.5 py-0.5 text-[11px] bg-[#d4eeec] text-[#5BA8A0]">
                      {domain}
                    </span>
                  ) : null}
                </div>
                <p className="text-[#8b8b8b] leading-snug">{r.snippet}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface RetrievalPracticeFeedback {
  assessment: "strong" | "partial" | "needs_work";
  whatWasRight: string[];
  whatWasMissed: string[];
  correctedExplanation: string;
  followUpQuestion: string;
}

interface RetrievalPracticeOutput {
  topic: string;
  status: "question" | "feedback";
  question: string;
  hint?: string;
  feedback?: RetrievalPracticeFeedback;
}

const assessmentLabel: Record<RetrievalPracticeFeedback["assessment"], string> =
  {
    strong: "Strong",
    partial: "Partial",
    needs_work: "Needs Work",
  };

const assessmentColor: Record<RetrievalPracticeFeedback["assessment"], string> =
  {
    strong: "text-emerald-600 bg-emerald-100",
    partial: "text-amber-600 bg-amber-100",
    needs_work: "text-red-600 bg-red-100",
  };

function RetrievalPracticePart({
  state,
  output,
}: {
  state: string;
  output?: RetrievalPracticeOutput;
}) {
  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <BrainCircuit size={14} className="animate-pulse" />
        Preparing recall challenge...
      </div>
    );
  }

  if (!output) return null;

  if (output.status === "question") {
    return (
      <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px] px-3 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-[#5BA8A0]" />
          <span className="font-medium text-[#1a1a1a]">Recall Challenge</span>
          <span className="rounded px-1.5 py-0.5 text-[11px] bg-[#d4eeec] text-[#5BA8A0]">
            {output.topic}
          </span>
        </div>
        <p className="text-[#5BA8A0] italic leading-snug">{output.question}</p>
        {output.hint ? (
          <p className="text-[#8b8b8b] leading-snug text-[12px]">
            Hint: {output.hint}
          </p>
        ) : null}
      </div>
    );
  }

  // Feedback phase
  const fb = output.feedback;
  if (!fb) return null;

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px] px-3 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <BrainCircuit size={14} className="text-[#5BA8A0]" />
        <span className="font-medium text-[#1a1a1a]">Recall Feedback</span>
        <span className="rounded px-1.5 py-0.5 text-[11px] bg-[#d4eeec] text-[#5BA8A0]">
          {output.topic}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] ${assessmentColor[fb.assessment]}`}
        >
          {assessmentLabel[fb.assessment]}
        </span>
      </div>
      {fb.whatWasRight.length > 0 ? (
        <div>
          <span className="font-medium text-emerald-600">
            What you got right:
          </span>
          <ul className="mt-1 space-y-0.5">
            {fb.whatWasRight.map((item) => (
              <li
                key={item}
                className="flex gap-1.5 text-[#1a1a1a] leading-snug"
              >
                <span className="text-emerald-500 shrink-0">+</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {fb.whatWasMissed.length > 0 ? (
        <div>
          <span className="font-medium text-red-500">What was missed:</span>
          <ul className="mt-1 space-y-0.5">
            {fb.whatWasMissed.map((item) => (
              <li
                key={item}
                className="flex gap-1.5 text-[#1a1a1a] leading-snug"
              >
                <span className="text-red-400 shrink-0">&minus;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-[#1a1a1a] leading-snug">{fb.correctedExplanation}</p>
      <p className="text-[#5BA8A0] font-medium italic leading-snug">
        {fb.followUpQuestion}
      </p>
    </div>
  );
}

interface ProgressiveDisclosureLayer {
  level: number;
  title: string;
  explanation: string;
  analogy?: string;
  readinessQuestion: string;
}

interface ProgressiveDisclosureOutput {
  concept: string;
  layers: ProgressiveDisclosureLayer[];
  currentLevel: number;
}

function ProgressiveDisclosurePart({
  state,
  output,
}: {
  state: string;
  output?: ProgressiveDisclosureOutput;
}) {
  const [revealedLevel, setRevealedLevel] = useState(1);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Layers size={14} className="animate-pulse" />
        Building layered explanation...
      </div>
    );
  }

  if (!output) return null;

  const { layers } = output;

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px] px-3 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-[#5BA8A0]" />
        <span className="font-medium text-[#1a1a1a]">{output.concept}</span>
      </div>

      {/* Level progress indicator */}
      <div className="flex items-center gap-1.5">
        {layers.map((layer) => (
          <div
            key={layer.level}
            className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium ${
              layer.level <= revealedLevel
                ? "bg-[#5BA8A0] text-white"
                : "bg-[#d4eeec] text-[#8b8b8b]"
            }`}
          >
            {layer.level}
          </div>
        ))}
      </div>

      {/* Revealed layers */}
      {layers
        .filter((layer) => layer.level <= revealedLevel)
        .map((layer) => (
          <div
            key={layer.level}
            className="border-l-2 border-[#5BA8A0] pl-3 space-y-1"
          >
            <p className="font-medium text-[#1a1a1a]">
              Level {layer.level}: {layer.title}
            </p>
            <p className="text-[#1a1a1a] leading-snug">{layer.explanation}</p>
            {layer.analogy ? (
              <p className="text-[#8b8b8b] italic leading-snug">
                {layer.analogy}
              </p>
            ) : null}
            <p className="text-[#5BA8A0] italic leading-snug">
              {layer.readinessQuestion}
            </p>
          </div>
        ))}

      {/* Go deeper button */}
      {revealedLevel < layers.length ? (
        <button
          type="button"
          onClick={() => setRevealedLevel((l) => l + 1)}
          className="flex items-center gap-1.5 rounded-lg border border-[#5BA8A0] px-3 py-1.5 text-[12px] font-medium text-[#5BA8A0] transition-colors hover:bg-[#5BA8A0] hover:text-white"
        >
          Go deeper
          <ChevronDown size={12} />
        </button>
      ) : null}
    </div>
  );
}

function removeFileAtIndex(files: FileList, index: number): FileList {
  const dt = new DataTransfer();
  for (let i = 0; i < files.length; i++) {
    if (i !== index) dt.items.add(files[i]);
  }
  return dt.files;
}

interface ComposerProps {
  formClassName: string;
  placeholder: string;
  rows: number;
  textareaPadding: string;
  input: string;
  isLoading: boolean;
  isDragging: boolean;
  files: FileList | undefined;
  fileUrls: string[];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

function Composer({
  formClassName,
  placeholder,
  rows,
  textareaPadding,
  input,
  isLoading,
  isDragging,
  files,
  fileUrls,
  textareaRef,
  fileInputRef,
  onSubmit,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  onKeyDown,
  onFileChange,
  onRemoveFile,
}: ComposerProps) {
  const hasFiles = files && files.length > 0;

  return (
    <form
      onSubmit={onSubmit}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={formClassName}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={onFileChange}
        className="hidden"
        data-testid="file-input"
      />
      <div
        className={`relative rounded-2xl border bg-white transition-all focus-within:border-[#5BA8A0] ${isDragging ? "border-[#5BA8A0] border-dashed border-2" : "border-[#d4eeec]"}`}
        style={{ boxShadow: composerShadow }}
      >
        {hasFiles ? (
          <div
            className="flex gap-2 px-5 pt-3 pb-1 overflow-x-auto"
            data-testid="file-preview"
          >
            {Array.from(files).map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="relative shrink-0 group"
              >
                <img
                  src={fileUrls[index] ?? ""}
                  alt={file.name}
                  className="w-16 h-16 rounded-lg object-cover border border-[#d4eeec]"
                />
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`relative z-10 w-full resize-none bg-transparent pl-14 pr-5 ${textareaPadding} text-[15px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none`}
          disabled={isLoading}
        />
        <div className="absolute bottom-3 left-3 z-20">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[#8b8b8b] transition-all hover:text-[#5BA8A0] hover:bg-[#f0faf9] disabled:opacity-50 disabled:hover:text-[#8b8b8b] disabled:hover:bg-transparent"
            aria-label="Upload image"
          >
            <ImagePlus size={18} />
          </button>
        </div>
        <div className="absolute bottom-3 right-3 z-20">
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !hasFiles)}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#5BA8A0] text-white transition-all hover:shadow-lg hover:scale-105 disabled:bg-[#d4eeec] disabled:text-[#b5b0a8] disabled:scale-100 disabled:shadow-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}

const taglines = [
  "I'll ask you the hard questions.",
  "The unexamined life is not worth living.",
  "Want someone to challenge your thinking?",
];

const starterCardColors = [
  { border: "#0055FF", bg: "#EBF0FF" }, // blue
  { border: "#7B2FBE", bg: "#F0E8F8" }, // purple
  { border: "#FF33CC", bg: "#FFF0F8" }, // magenta
  { border: "#008888", bg: "#E8FFF5" }, // teal
  { border: "#F87272", bg: "#FFF0F0" }, // coral
  { border: "#00D4A0", bg: "#E8FFF8" }, // green
];

const starterCards = [
  {
    title: "Challenge my beliefs",
    subtitle: "Pick a belief and I'll question every assumption",
    prompt:
      "I want you to challenge my beliefs. Pick a belief I might hold and question every assumption behind it.",
  },
  {
    title: "Stress-test my startup idea",
    subtitle: "I'll find every weakness before your competitors do",
    prompt:
      "I have a startup idea I'd like you to stress-test. Help me find every weakness before my competitors do.",
  },
  {
    title: "Explore an ethical dilemma",
    subtitle: "No easy answers, just better questions",
    prompt:
      "I want to explore an ethical dilemma with you. Give me a challenging one with no easy answers.",
  },
  {
    title: "Find my life's direction",
    subtitle: "What should you actually be doing with your time?",
    prompt:
      "Help me think about what I should actually be doing with my life. I want to find my direction.",
  },
  {
    title: "Do we have free will?",
    subtitle: "Or is everything predetermined?",
    prompt:
      "Do we have free will, or is everything predetermined? I want to explore this question deeply.",
  },
  {
    title: "Debate a hot take",
    subtitle: "I'll build the strongest case against your position",
    prompt:
      "I have a hot take I want to debate. I'll share my position and you build the strongest case against it.",
  },
];

interface ConversationListItem {
  id: string;
  title: string;
  updated_at: string;
}

async function saveMessageToDb(
  conversationId: string,
  role: "user" | "assistant",
  parts: unknown,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, content: parts }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function Chat() {
  const { c: urlConversationId } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationList, setConversationList] = useState<
    ConversationListItem[]
  >([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(urlConversationId);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");

  const fetchConversationList = useCallback(() => {
    fetch("/api/conversations")
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data: { conversations: ConversationListItem[] } | undefined) => {
        if (data?.conversations) {
          setConversationList(data.conversations);
        }
      })
      .catch(() => {
        // Database unavailable — leave list as-is
      });
  }, []);

  // Load models on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/models", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ModelOption[]) => {
        setModels(data);
        if (data.length > 0) setSelectedModelId(data[0].id);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Load conversation list on mount
  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  // Load conversation when URL changes
  useEffect(() => {
    if (urlConversationId) {
      fetch(`/api/conversations/${urlConversationId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then(
          (data: {
            messages: {
              id: string;
              role: "user" | "assistant";
              content: unknown;
              created_at: string;
            }[];
          }) => {
            const msgs: UIMessage[] = data.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: "",
              parts: m.content as UIMessage["parts"],
              createdAt: new Date(m.created_at),
            }));
            setInitialMessages(msgs);
            setCurrentConversationId(urlConversationId);
          },
        )
        .catch(() => {
          setInitialMessages([]);
          setCurrentConversationId(undefined);
        });
    } else {
      setInitialMessages([]);
      setCurrentConversationId(undefined);
    }
  }, [urlConversationId]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setSidebarOpen(false);
      navigate({ search: { c: id } });
    },
    [navigate],
  );

  const handleNewConversation = useCallback(() => {
    setSidebarOpen(false);
    setInitialMessages([]);
    setCurrentConversationId(undefined);
    navigate({ search: { c: undefined } });
  }, [navigate]);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      fetch(`/api/conversations/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) return;
          fetchConversationList();
          if (id === currentConversationId) {
            handleNewConversation();
          }
        })
        .catch(() => {
          // Delete failed — leave list as-is
        });
    },
    [currentConversationId, fetchConversationList, handleNewConversation],
  );

  const handleConversationCreated = useCallback(
    (id: string) => {
      setCurrentConversationId(id);
      navigate({ search: { c: id } });
      fetchConversationList();
    },
    [navigate, fetchConversationList],
  );

  const handleMessageSaved = useCallback(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversationList}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <ChatView
        key={currentConversationId ?? "new"}
        initialMessages={initialMessages}
        conversationId={currentConversationId}
        models={models}
        selectedModelId={selectedModelId}
        onSelectedModelIdChange={setSelectedModelId}
        onConversationCreated={handleConversationCreated}
        onMessageSaved={handleMessageSaved}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
    </>
  );
}

interface ChatViewProps {
  initialMessages: UIMessage[];
  conversationId: string | undefined;
  models: ModelOption[];
  selectedModelId: string;
  onSelectedModelIdChange: (id: string) => void;
  onConversationCreated: (id: string) => void;
  onMessageSaved: () => void;
  onToggleSidebar: () => void;
}

function ChatView({
  initialMessages,
  conversationId,
  models,
  selectedModelId,
  onSelectedModelIdChange,
  onConversationCreated,
  onMessageSaved,
  onToggleSidebar,
}: ChatViewProps) {
  const [taglineIndex] = useState(() =>
    Math.floor(Math.random() * taglines.length),
  );
  const convIdRef = useRef(conversationId);

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    onFinish: async ({ message }) => {
      const cId = convIdRef.current;
      if (cId && message.role === "assistant") {
        await saveMessageToDb(cId, "assistant", message.parts);
        onMessageSaved();
      }
    },
  });
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrls = useMemo(() => {
    if (!files || files.length === 0) return [];
    return Array.from(files).map((file) => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      for (const url of fileUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileUrls]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const onInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages && messages.length > 0;
  const hasFiles = files && files.length > 0;

  const submit = useCallback(
    async (textOverride?: string) => {
      const text = textOverride ?? input.trim();
      if ((!text && !hasFiles) || isLoading) return;
      if (!textOverride) setInput("");

      // Create conversation if needed
      let cId = convIdRef.current;
      if (!cId) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const conv = (await res.json()) as { id: string };
          cId = conv.id;
          convIdRef.current = cId;
          onConversationCreated(cId);
        } catch {
          // Continue without persistence
        }
      }

      // Build parts for saving
      const parts: unknown[] = [];
      if (text) parts.push({ type: "text", text });

      // Save user message
      if (cId && parts.length > 0) {
        await saveMessageToDb(cId, "user", parts);
        onMessageSaved();
      }

      sendMessage(
        { text, files: textOverride ? undefined : files },
        { body: { modelId: selectedModelId } },
      );
      if (!textOverride) {
        setFiles(undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    },
    [
      input,
      isLoading,
      sendMessage,
      selectedModelId,
      files,
      hasFiles,
      onConversationCreated,
      onMessageSaved,
    ],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = filterValidFiles(Array.from(e.target.files));
      if (valid.length > 0) {
        const dt = new DataTransfer();
        for (const f of valid) dt.items.add(f);
        setFiles(dt.files);
      }
    }
  };

  const removeFile = (index: number) => {
    if (!files) return;
    const updated = removeFileAtIndex(files, index);
    if (updated.length === 0) {
      setFiles(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFiles(updated);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const valid = filterValidFiles(Array.from(e.dataTransfer.files));
    if (valid.length > 0) {
      const dt = new DataTransfer();
      for (const f of valid) dt.items.add(f);
      setFiles(dt.files);
    }
  };

  const renderMessageParts = (message: (typeof messages)[number]) => {
    const elements: React.ReactNode[] = [];
    const imageFiles: { filename?: string }[] = [];

    for (const [i, part] of message.parts.entries()) {
      if (part.type === "text") {
        if (message.role === "assistant") {
          elements.push(
            <div
              key={`text-${i}`}
              className="prose-socrates text-[15px] leading-relaxed"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>,
          );
        } else {
          elements.push(
            <div
              key={`text-${i}`}
              className="prose-user text-[15px] leading-relaxed"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>,
          );
        }
      } else if (
        part.type === "file" &&
        typeof part.mediaType === "string" &&
        part.mediaType.startsWith("image/")
      ) {
        imageFiles.push({ filename: part.filename });
      } else if (part.type === "tool-webSearch") {
        elements.push(
          <WebSearchPart
            key={`ws-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as {
                    results: SearchResult[];
                    error?: string;
                  })
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-saveInsight") {
        elements.push(
          <SaveInsightPart
            key={`si-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as {
                    saved: boolean;
                    insight: string;
                    topic: string | null;
                  })
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-devilsAdvocate") {
        elements.push(
          <DevilsAdvocatePart
            key={`da-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as DevilsAdvocateOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-factCheck") {
        elements.push(
          <FactCheckPart
            key={`fc-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as FactCheckOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-logicalAnalysis") {
        elements.push(
          <LogicalAnalysisPart
            key={`la-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as LogicalAnalysisOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-perspectiveShift") {
        elements.push(
          <PerspectiveShiftPart
            key={`ps-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as PerspectiveShiftOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-mapArgument") {
        elements.push(
          <ArgumentMapPart
            key={`am-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as ArgumentMapOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-suggestReading") {
        elements.push(
          <ReadingListPart
            key={`rl-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as ReadingListOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-discoverResources") {
        elements.push(
          <DiscoverResourcesPart
            key={`dr-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as DiscoverResourcesOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-drawDiagram") {
        elements.push(
          <DiagramPart
            key={`dd-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as {
                    title: string;
                    diagramType: "flowchart" | "sequence" | "class";
                    mermaidSyntax: string;
                  })
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-retrievalPractice") {
        elements.push(
          <RetrievalPracticePart
            key={`rp-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as RetrievalPracticeOutput)
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-progressiveDisclosure") {
        elements.push(
          <ProgressiveDisclosurePart
            key={`pd-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as ProgressiveDisclosureOutput)
                : undefined
            }
          />,
        );
      }
    }

    if (imageFiles.length > 0) {
      const count = imageFiles.length;
      const label = `${count} ${count === 1 ? "image" : "images"} attached`;
      const names = imageFiles
        .map((f) => f.filename)
        .filter(Boolean)
        .join(", ");

      elements.push(
        <p key="image-summary" className="text-[13px] italic opacity-80 mt-1">
          {label}
          {names ? ` (${names})` : null}
        </p>,
      );
    }

    return elements;
  };

  const composerProps = {
    input,
    isLoading,
    isDragging,
    files,
    fileUrls,
    textareaRef,
    fileInputRef,
    onSubmit: handleFormSubmit,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onInputChange,
    onKeyDown: handleKeyDown,
    onFileChange: handleFileChange,
    onRemoveFile: removeFile,
  };

  // Empty state
  if (!hasMessages) {
    return (
      <div className="flex flex-col h-screen bg-[#fafafa]">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-4 py-12 min-h-full justify-center">
            <img
              src="/socrates.svg"
              alt="Soundboard as a Service"
              className="w-80 h-auto mb-4"
            />
            <h1 className="text-2xl font-medium text-[#1a1a1a] mb-1">
              {taglines[taglineIndex]}
            </h1>
            {models.length > 1 ? (
              <div className="relative mt-3 mb-6">
                <select
                  value={selectedModelId}
                  onChange={(e) => onSelectedModelIdChange(e.target.value)}
                  className="appearance-none rounded-lg border border-[#d4eeec] bg-white px-3 py-1.5 pr-8 text-xs text-[#8b8b8b] focus:border-[#5BA8A0] focus:outline-none cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl mb-6 mt-2">
              {starterCards.map((card, index) => {
                const colors =
                  starterCardColors[index % starterCardColors.length];
                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => submit(card.prompt)}
                    disabled={isLoading}
                    className="text-left rounded-xl border-l-4 px-4 py-3 transition-all hover:shadow-md disabled:opacity-50"
                    style={{
                      borderLeftColor: colors.border,
                      backgroundColor: colors.bg,
                    }}
                  >
                    <p className="font-medium text-[14px] text-[#1a1a1a]">
                      {card.title}
                    </p>
                    <p className="text-[13px] text-[#8b8b8b] mt-0.5">
                      {card.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
            <Composer
              {...composerProps}
              formClassName="w-full max-w-2xl"
              placeholder="Share a thought or belief..."
              rows={3}
              textareaPadding="pt-4 pb-14"
            />
          </div>
        </div>
      </div>
    );
  }

  // Conversation view
  return (
    <div className="flex flex-col h-screen bg-[#fafafa]">
      {/* Sticky header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 bg-[#fafafa] border-b border-[#eae7e3]">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#8b8b8b] hover:text-[#1a1a1a] hover:bg-[#f0faf9] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <img
          src="/socrates.svg"
          alt="Soundboard as a Service"
          className="w-10 h-10"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-medium text-[#1a1a1a] leading-tight">
            Soundboard as a Service
          </h1>
          <p className="text-xs text-[#8b8b8b]">
            Just when they told you that SaaS was dead
          </p>
        </div>
        {models.length > 1 ? (
          <div className="relative shrink-0">
            <select
              value={selectedModelId}
              onChange={(e) => onSelectedModelIdChange(e.target.value)}
              className="appearance-none rounded-lg border border-[#d4eeec] bg-white px-3 py-1.5 pr-8 text-xs text-[#8b8b8b] focus:border-[#5BA8A0] focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
            />
          </div>
        ) : null}
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl bg-[#5BA8A0] px-5 py-3 text-white"
                    style={{ boxShadow: composerShadow }}
                  >
                    {renderMessageParts(message)}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <img
                    src="/socrates.svg"
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                  />
                  <div className="min-w-0">{renderMessageParts(message)}</div>
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" ? (
            <div className="flex gap-3">
              <img
                src="/socrates.svg"
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
              />
              <div className="flex items-center gap-1.5 py-2">
                <span className="w-2 h-2 rounded-full bg-[#5BA8A0] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#F08B8B] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#CCFFFF] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Pinned composer at bottom */}
      <div className="shrink-0 border-t border-[#eae7e3] bg-[#fafafa] px-4 py-4">
        <Composer
          {...composerProps}
          formClassName="mx-auto max-w-2xl"
          placeholder="Reply..."
          rows={1}
          textareaPadding="pt-3.5 pb-12"
        />
      </div>
    </div>
  );
}
