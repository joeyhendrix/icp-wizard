"use client";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [history, setHistory] = useState<Msg[]>([
    { role: "assistant", content: "Let’s define your ICP. What industry or vertical are your best customers in?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [final, setFinal] = useState<{ md?: string; json?: string; companies?: string; people?: string }>({});

  async function send(finalize = false) {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/icp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, finalize })
    });
    const { text } = await res.json();

    if (finalize) {
      const md = pull(text, "---MARKDOWN---", "---JSON---");
      const json = pull(text, "---JSON---", "---CSV_COMPANIES---");
      const companies = pull(text, "---CSV_COMPANIES---", "---CSV_PEOPLE---");
      const people = text.split("---CSV_PEOPLE---")[1]?.trim();
      setFinal({ md, json, companies, people });
      setHistory(h => [...h, { role: "assistant", content: "Done. Scroll down for your summary and files." }]);
    } else {
      setHistory(h => [...h, { role: "assistant", content: text }]);
    }
    setBusy(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setHistory(h => [...h, { role: "user", content: input.trim() }]);
    setInput("");
    setTimeout(() => send(false), 0);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">ICP Discovery</h1>

      <div className="space-y-3 border rounded p-3 h-[420px] overflow-auto bg-white">
        {history.map((m, i) => (
          <div key={i} className={m.role === "assistant" ? "text-gray-900" : "text-blue-700"}>
            <b>{m.role === "assistant" ? "Assistant" : "You"}:</b> {m.content}
          </div>
        ))}
        {busy && (
    <div className="text-gray-500 italic">Assistant is thinking…</div>
  )}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          className="flex-1 border rounded p-2"
        />
        <button disabled={busy} className="border rounded px-3">Send</button>
        <button type="button" disabled={busy} onClick={() => send(true)} className="border rounded px-3">
          Finalize
        </button>
      </form>

      {final.md && (
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Summary</h2>
          <pre className="whitespace-pre-wrap border p-3 rounded bg-white">{final.md}</pre>

          <h3 className="font-semibold">ICP JSON</h3>
          <pre className="overflow-auto border p-3 rounded bg-white">{final.json}</pre>

          <h3 className="font-semibold">companies.csv</h3>
          <pre className="overflow-auto border p-3 rounded bg-white">{final.companies}</pre>

          <h3 className="font-semibold">people.csv</h3>
          <pre className="overflow-auto border p-3 rounded bg-white">{final.people}</pre>

          <div className="flex gap-2">
            <Download name="companies.csv" data={final.companies || ""} />
            <Download name="people.csv" data={final.people || ""} />
            <Download name="icp.json" data={final.json || ""} />
          </div>
        </section>
      )}
    </main>
  );
}

function pull(src: string, start: string, end: string) {
  const s = src.indexOf(start);
  const e = src.indexOf(end);
  if (s === -1 || e === -1 || e <= s) return "";
  return src.slice(s + start.length, e).trim();
}

function Download({ name, data }: { name: string; data: string }) {
  function dl() {
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  return <button onClick={dl} className="border rounded px-3">Download {name}</button>;
}


